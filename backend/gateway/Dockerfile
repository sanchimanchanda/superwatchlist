# Build Stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod ./
COPY . ./

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /gateway .

# Final Runner Stage
FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache wget ca-certificates

COPY --from=builder /gateway /app/gateway

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=5s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["/app/gateway"]
