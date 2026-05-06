# Dev stage — hot reload with air
FROM golang:1.26-alpine AS dev
RUN go install github.com/air-verse/air@latest
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
EXPOSE 8009
CMD ["air"]

# Build stage — production binary
FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /api ./cmd/api

# Runtime stage — minimal production image
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
COPY --from=build /api /api
EXPOSE 8009
ENTRYPOINT ["/api"]
