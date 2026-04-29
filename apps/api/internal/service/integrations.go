package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/griotandgrits/platform/apps/api/internal/config"
)

// IntegrationsService wraps third-party API calls used by the public site:
// Mailchimp newsletter signup and Classy/GoFundMe campaign data.
type IntegrationsService struct {
	cfg        config.IntegrationsConfig
	httpClient *http.Client
}

func NewIntegrationsService(cfg config.IntegrationsConfig) *IntegrationsService {
	return &IntegrationsService{
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

// Subscribe adds an email to the configured Mailchimp audience.
func (s *IntegrationsService) Subscribe(ctx context.Context, email, listType string) error {
	if s.cfg.MailchimpAPIKey == "" || s.cfg.MailchimpServer == "" || s.cfg.MailchimpAudienceID == "" {
		return ErrMailchimpNotConfigured
	}
	endpoint := fmt.Sprintf("https://%s.api.mailchimp.com/3.0/lists/%s/members",
		s.cfg.MailchimpServer, s.cfg.MailchimpAudienceID)

	body, err := json.Marshal(map[string]any{
		"email_address": email,
		"status":        "subscribed",
		"merge_fields":  map[string]string{"TYPE": listType},
	})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(string(body)))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "apikey "+s.cfg.MailchimpAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return &SubscribeError{
			Status:  resp.StatusCode,
			Message: "Failed to subscribe, please ensure your email is correct and that you have not already subscribed",
			Body:    truncate(string(respBody), 300),
		}
	}
	return nil
}

// PublicCampaign matches the JSON shape served by the old Next.js
// /api/gofundme/public route and consumed by the GoFundMe component.
type PublicCampaign struct {
	ID                     string         `json:"id"`
	Title                  string         `json:"title"`
	Description            string         `json:"description"`
	Goal                   float64        `json:"goal"`
	CurrentAmount          float64        `json:"current_amount"`
	Currency               string         `json:"currency"`
	Status                 string         `json:"status"`
	DonorsCount            int            `json:"donors_count"`
	PercentToGoal          float64        `json:"percent_to_goal"`
	URL                    string         `json:"url"`
	Organizer              CampaignParty  `json:"organizer"`
	MinimumDonationAmount  float64        `json:"minimum_donation_amount,omitempty"`
}

type CampaignParty struct {
	Name     string `json:"name"`
	Location string `json:"location"`
}

// AuthenticatedCampaign is the richer payload returned by the authenticated
// /api/gofundme/campaign route — passed straight through from Classy.
type AuthenticatedCampaign map[string]any

// PublicCampaignByID fetches a campaign using a client-credentials token, then
// folds in overview metrics. Mirrors the Next.js public route.
func (s *IntegrationsService) PublicCampaignByID(ctx context.Context, campaignID, fallbackURL string) (*PublicCampaign, error) {
	if s.cfg.GoFundMeClientID == "" || s.cfg.GoFundMeClientSecret == "" {
		return nil, ErrGoFundMeNotConfigured
	}
	token, err := s.classyClientToken(ctx)
	if err != nil {
		return nil, fmt.Errorf("classy token: %w", err)
	}

	classy, err := s.classyGET(ctx, fmt.Sprintf("https://api.classy.org/2.0/campaigns/%s", campaignID), token)
	if err != nil {
		return nil, fmt.Errorf("fetch campaign: %w", err)
	}

	current, donors, percent := 0.0, 0, 0.0
	if overview, oErr := s.classyGET(ctx,
		fmt.Sprintf("https://api.classy.org/2.0/campaigns/%s/overview", campaignID), token); oErr == nil {
		current = parseFloat(overview["total_gross_amount"])
		donors = parseInt(overview["donors_count"])
		percent = parseFloat(overview["percent_to_goal"])
	}

	return &PublicCampaign{
		ID:                    stringValue(classy["id"], campaignID),
		Title:                 firstString(classy["name"], classy["title"], "Campaign Title"),
		Description:           firstString(classy["description"], classy["story"], ""),
		Goal:                  firstFloat(classy["goal"], classy["raw_goal"]),
		CurrentAmount:         current,
		Currency:              firstString(classy["currency_code"], "USD"),
		Status:                firstString(classy["status"], "active"),
		DonorsCount:           donors,
		PercentToGoal:         percent,
		URL:                   firstString(classy["canonical_url"], fallbackURL, fmt.Sprintf("https://give.griotandgrits.org/campaign/%s/donate", campaignID)),
		Organizer:             extractOrganizer(classy["organizer"]),
		MinimumDonationAmount: firstFloat(classy["minimum_donation_amount"], 5.0),
	}, nil
}

// AuthenticatedCampaignByID returns the raw Classy campaign payload using a
// caller-supplied bearer token. Mirrors the Next.js authenticated route.
func (s *IntegrationsService) AuthenticatedCampaignByID(ctx context.Context, campaignID, accessToken string) (AuthenticatedCampaign, int, error) {
	if accessToken == "" {
		return nil, http.StatusUnauthorized, errors.New("access token is required")
	}
	endpoint := fmt.Sprintf("https://api.classy.org/2.0/campaigns/%s", campaignID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, http.StatusBadGateway, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, resp.StatusCode, fmt.Errorf("classy %d: %s", resp.StatusCode, truncate(string(body), 200))
	}
	var payload AuthenticatedCampaign
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, http.StatusBadGateway, err
	}
	return payload, http.StatusOK, nil
}

// --- internals ---

func (s *IntegrationsService) classyClientToken(ctx context.Context) (string, error) {
	form := url.Values{}
	form.Set("grant_type", "client_credentials")
	form.Set("client_id", s.cfg.GoFundMeClientID)
	form.Set("client_secret", s.cfg.GoFundMeClientSecret)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://api.classy.org/oauth2/auth", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("token request %d: %s", resp.StatusCode, truncate(string(body), 200))
	}
	var tr struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tr); err != nil {
		return "", err
	}
	if tr.AccessToken == "" {
		return "", errors.New("classy returned no access token")
	}
	return tr.AccessToken, nil
}

func (s *IntegrationsService) classyGET(ctx context.Context, url, token string) (map[string]any, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("%s -> %d: %s", url, resp.StatusCode, truncate(string(body), 200))
	}
	var out map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out, nil
}

// --- errors ---

var (
	ErrMailchimpNotConfigured = errors.New("mailchimp not configured")
	ErrGoFundMeNotConfigured  = errors.New("gofundme not configured")
)

type SubscribeError struct {
	Status  int
	Message string
	Body    string
}

func (e *SubscribeError) Error() string {
	return fmt.Sprintf("subscribe failed (%d): %s", e.Status, e.Message)
}

// --- value extraction helpers ---

func parseFloat(v any) float64 {
	switch x := v.(type) {
	case float64:
		return x
	case float32:
		return float64(x)
	case int:
		return float64(x)
	case int64:
		return float64(x)
	case string:
		f, err := strconv.ParseFloat(x, 64)
		if err == nil {
			return f
		}
	}
	return 0
}

func parseInt(v any) int {
	switch x := v.(type) {
	case float64:
		return int(x)
	case int:
		return x
	case int64:
		return int(x)
	case string:
		i, err := strconv.Atoi(x)
		if err == nil {
			return i
		}
	}
	return 0
}

func stringValue(v any, fallback string) string {
	switch x := v.(type) {
	case string:
		if x != "" {
			return x
		}
	case float64:
		return strconv.FormatFloat(x, 'f', -1, 64)
	case int:
		return strconv.Itoa(x)
	case int64:
		return strconv.FormatInt(x, 10)
	}
	return fallback
}

func firstString(values ...any) string {
	for _, v := range values {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	if len(values) > 0 {
		if s, ok := values[len(values)-1].(string); ok {
			return s
		}
	}
	return ""
}

func firstFloat(values ...any) float64 {
	for _, v := range values {
		if v == nil {
			continue
		}
		if f := parseFloat(v); f != 0 {
			return f
		}
	}
	// Fall back to last value parsed (handles literal default like 5.0).
	if len(values) > 0 {
		return parseFloat(values[len(values)-1])
	}
	return 0
}

func extractOrganizer(v any) CampaignParty {
	m, ok := v.(map[string]any)
	if !ok {
		return CampaignParty{Name: "Griot and Grits Team", Location: "United States"}
	}
	first, _ := m["first_name"].(string)
	last, _ := m["last_name"].(string)
	name, _ := m["name"].(string)
	loc, _ := m["location"].(string)

	if first != "" {
		full := strings.TrimSpace(first + " " + last)
		return CampaignParty{Name: full, Location: defaultIfEmpty(loc, "United States")}
	}
	return CampaignParty{
		Name:     defaultIfEmpty(name, "Griot and Grits Team"),
		Location: defaultIfEmpty(loc, "United States"),
	}
}

func defaultIfEmpty(s, fallback string) string {
	if s == "" {
		return fallback
	}
	return s
}
