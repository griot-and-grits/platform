package config

import (
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Environment  string             `mapstructure:"environment"`
	Server       ServerConfig       `mapstructure:"server"`
	Database     DatabaseConfig     `mapstructure:"db"`
	Storage      StorageConfig      `mapstructure:"storage"`
	Archive      ArchiveConfig      `mapstructure:"archive"`
	CORS         CORSConfig         `mapstructure:"cors"`
	Processing   ProcessingConfig   `mapstructure:"processing"`
	Pipeline     PipelineConfig     `mapstructure:"pipeline"`
	Auth         AuthConfig         `mapstructure:"auth"`
	Integrations IntegrationsConfig `mapstructure:"integrations"`
}

type ServerConfig struct {
	Port              int           `mapstructure:"port"`
	ReadTimeout       time.Duration `mapstructure:"read_timeout"`
	ReadHeaderTimeout time.Duration `mapstructure:"read_header_timeout"`
	WriteTimeout      time.Duration `mapstructure:"write_timeout"`
	IdleTimeout       time.Duration `mapstructure:"idle_timeout"`
	ShutdownTimeout   time.Duration `mapstructure:"shutdown_timeout"`
	MaxUploadSize     int64         `mapstructure:"max_upload_size"`
	MaxHeaderBytes    int           `mapstructure:"max_header_bytes"`
	MaxJSONBodyBytes  int64         `mapstructure:"max_json_body_bytes"`
}

type DatabaseConfig struct {
	URI         string `mapstructure:"uri"`
	Name        string `mapstructure:"name"`
	MaxPoolSize uint64 `mapstructure:"max_pool_size"`
	MinPoolSize uint64 `mapstructure:"min_pool_size"`
}

type StorageConfig struct {
	Endpoint  string `mapstructure:"endpoint"`
	AccessKey string `mapstructure:"access_key"`
	SecretKey string `mapstructure:"secret_key"`
	Bucket    string `mapstructure:"bucket"`
	Region    string `mapstructure:"region"`
	Secure    bool   `mapstructure:"secure"`
}

type ArchiveConfig struct {
	Provider         string `mapstructure:"provider"`
	Bucket           string `mapstructure:"bucket"`
	GlobusEnabled    bool   `mapstructure:"globus_enabled"`
	GlobusEndpointID string `mapstructure:"globus_endpoint_id"`
	GlobusBasePath   string `mapstructure:"globus_base_path"`
	GlobusClientID   string `mapstructure:"globus_client_id"`
	GlobusClientSecret string `mapstructure:"globus_client_secret"`
}

type CORSConfig struct {
	AllowedOrigins []string
	rawOrigins     string `mapstructure:"allowed_origins"`
}

type ProcessingConfig struct {
	EnableTranscription      bool `mapstructure:"enable_transcription"`
	EnableMetadataExtraction bool `mapstructure:"enable_metadata_extraction"`
	EnableLLMEnrichment      bool `mapstructure:"enable_llm_enrichment"`
}

type PipelineConfig struct {
	Provider       string `mapstructure:"provider"`
	RedisURL       string `mapstructure:"redis_url"`
	CallbackSecret string `mapstructure:"callback_secret"`
	CallbackURL    string `mapstructure:"callback_url"`
}

type AuthConfig struct {
	Secret              string `mapstructure:"secret"`
	GitHubClientID      string `mapstructure:"github_client_id"`
	GitHubClientSecret  string `mapstructure:"github_client_secret"`
	AllowedEmails       string `mapstructure:"allowed_emails"`
	AllowedGitHubLogins string `mapstructure:"allowed_github_logins"`
	AllowedGitHubOrg    string `mapstructure:"allowed_github_org"`
	DevBypass           bool   `mapstructure:"dev_bypass"`
	DevToken            string `mapstructure:"dev_token"`
	CookieDomain        string `mapstructure:"cookie_domain"`
	CookieSecure        bool   `mapstructure:"cookie_secure"`
	PublicBaseURL       string `mapstructure:"public_base_url"`
	DefaultRedirect     string `mapstructure:"default_redirect"`
}

type IntegrationsConfig struct {
	MailchimpAPIKey      string `mapstructure:"mailchimp_api_key"`
	MailchimpServer      string `mapstructure:"mailchimp_server"`
	MailchimpAudienceID  string `mapstructure:"mailchimp_audience_id"`
	GoFundMeClientID     string `mapstructure:"gofundme_client_id"`
	GoFundMeClientSecret string `mapstructure:"gofundme_client_secret"`
}

func Load() (*Config, error) {
	v := viper.New()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	// Defaults
	v.SetDefault("environment", "development")

	// Server
	v.SetDefault("server.port", 8009)
	v.SetDefault("server.read_timeout", 30*time.Second)
	v.SetDefault("server.read_header_timeout", 10*time.Second)
	v.SetDefault("server.write_timeout", 5*time.Minute)
	v.SetDefault("server.idle_timeout", 120*time.Second)
	v.SetDefault("server.shutdown_timeout", 15*time.Second)
	v.SetDefault("server.max_upload_size", 100*1024*1024) // 100MB
	v.SetDefault("server.max_header_bytes", 1<<20)        // 1MB
	v.SetDefault("server.max_json_body_bytes", 1<<20)     // 1MB

	// Database
	v.SetDefault("db.uri", "mongodb://localhost:6732/")
	v.SetDefault("db.name", "gngdb")
	v.SetDefault("db.max_pool_size", 10)
	v.SetDefault("db.min_pool_size", 1)

	// Storage
	v.SetDefault("storage.endpoint", "localhost:6733")
	v.SetDefault("storage.access_key", "minioadmin")
	v.SetDefault("storage.secret_key", "minioadmin")
	v.SetDefault("storage.bucket", "artifacts")
	v.SetDefault("storage.region", "us-east-1")
	v.SetDefault("storage.secure", false)

	// Archive
	v.SetDefault("archive.provider", "minio-archive")
	v.SetDefault("archive.bucket", "archive")
	v.SetDefault("archive.globus_enabled", false)

	// CORS
	v.SetDefault("cors.allowed_origins", "http://localhost:6730")

	// Processing
	v.SetDefault("processing.enable_transcription", false)
	v.SetDefault("processing.enable_metadata_extraction", true)
	v.SetDefault("processing.enable_llm_enrichment", false)

	// Pipeline
	v.SetDefault("pipeline.provider", "redis-queue")
	v.SetDefault("pipeline.redis_url", "redis://localhost:6735/0")
	v.SetDefault("pipeline.callback_secret", "dev-secret-change-me")
	v.SetDefault("pipeline.callback_url", "http://localhost:6731")

	// Auth
	v.SetDefault("auth.secret", "dev-secret-change-me")
	v.SetDefault("auth.dev_bypass", false)
	v.SetDefault("auth.cookie_secure", false)
	v.SetDefault("auth.public_base_url", "http://localhost:6731")
	v.SetDefault("auth.default_redirect", "http://localhost:6730/admin")

	// Integrations
	v.SetDefault("integrations.mailchimp_api_key", "")
	v.SetDefault("integrations.gofundme_client_id", "")

	// Bind env vars with explicit prefixes to match the flat env var naming
	bindEnvs(v)

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	// Parse comma-separated CORS origins
	raw := v.GetString("cors.allowed_origins")
	cfg.CORS.AllowedOrigins = parseCORSOrigins(raw)

	return &cfg, nil
}

func bindEnvs(v *viper.Viper) {
	// Map flat env vars to nested config keys
	bindings := map[string]string{
		"environment":                      "ENVIRONMENT",
		"server.port":                      "SERVER_PORT",
		"server.read_timeout":              "SERVER_READ_TIMEOUT",
		"server.read_header_timeout":       "SERVER_READ_HEADER_TIMEOUT",
		"server.write_timeout":             "SERVER_WRITE_TIMEOUT",
		"server.idle_timeout":              "SERVER_IDLE_TIMEOUT",
		"server.shutdown_timeout":          "SERVER_SHUTDOWN_TIMEOUT",
		"server.max_upload_size":           "SERVER_MAX_UPLOAD_SIZE",
		"server.max_header_bytes":          "SERVER_MAX_HEADER_BYTES",
		"server.max_json_body_bytes":       "SERVER_MAX_JSON_BODY_BYTES",
		"db.uri":                           "DB_URI",
		"db.name":                          "DB_NAME",
		"db.max_pool_size":                 "DB_MAX_POOL_SIZE",
		"db.min_pool_size":                 "DB_MIN_POOL_SIZE",
		"storage.endpoint":                 "STORAGE_ENDPOINT",
		"storage.access_key":               "STORAGE_ACCESS_KEY",
		"storage.secret_key":               "STORAGE_SECRET_KEY",
		"storage.bucket":                   "STORAGE_BUCKET",
		"storage.region":                   "STORAGE_REGION",
		"storage.secure":                   "STORAGE_SECURE",
		"archive.provider":                 "ARCHIVE_PROVIDER",
		"archive.bucket":                   "ARCHIVE_BUCKET",
		"archive.globus_enabled":           "GLOBUS_ENABLED",
		"archive.globus_endpoint_id":       "GLOBUS_ENDPOINT_ID",
		"archive.globus_base_path":         "GLOBUS_BASE_PATH",
		"archive.globus_client_id":         "GLOBUS_CLIENT_ID",
		"archive.globus_client_secret":     "GLOBUS_CLIENT_SECRET",
		"cors.allowed_origins":             "CORS_ALLOWED_ORIGINS",
		"processing.enable_transcription":  "PROCESSING_ENABLE_TRANSCRIPTION",
		"processing.enable_metadata_extraction": "PROCESSING_ENABLE_METADATA_EXTRACTION",
		"processing.enable_llm_enrichment": "PROCESSING_ENABLE_LLM_ENRICHMENT",
		"pipeline.provider":                "PIPELINE_PROVIDER",
		"pipeline.redis_url":               "REDIS_URL",
		"pipeline.callback_secret":         "PIPELINE_CALLBACK_SECRET",
		"pipeline.callback_url":            "PIPELINE_CALLBACK_URL",
		"auth.secret":                      "AUTH_SECRET",
		"auth.github_client_id":            "GITHUB_CLIENT_ID",
		"auth.github_client_secret":        "GITHUB_CLIENT_SECRET",
		"auth.allowed_emails":              "ADMIN_ALLOWED_EMAILS",
		"auth.allowed_github_logins":       "ADMIN_ALLOWED_GITHUB_LOGINS",
		"auth.allowed_github_org":          "ADMIN_ALLOWED_GITHUB_ORG",
		"auth.dev_bypass":                  "ADMIN_DEV_BYPASS",
		"auth.dev_token":                   "ADMIN_DEV_TOKEN",
		"auth.cookie_domain":               "AUTH_COOKIE_DOMAIN",
		"auth.cookie_secure":               "AUTH_COOKIE_SECURE",
		"auth.public_base_url":             "AUTH_PUBLIC_BASE_URL",
		"auth.default_redirect":            "AUTH_DEFAULT_REDIRECT",
		"integrations.mailchimp_api_key":   "MAILCHIMP_API_KEY",
		"integrations.mailchimp_server":    "MAILCHIMP_API_SERVER",
		"integrations.mailchimp_audience_id": "MAILCHIMP_AUDIENCE_ID",
		"integrations.gofundme_client_id":  "GOFUNDME_CLIENT_ID",
		"integrations.gofundme_client_secret": "GOFUNDME_CLIENT_SECRET",
	}
	for key, env := range bindings {
		_ = v.BindEnv(key, env)
	}
}

func parseCORSOrigins(raw string) []string {
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	return origins
}

func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}
