# services/order-service/Dockerfile
# Go 1.14 Multi-stage build

FROM golang:1.14-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server

# Runtime stage
FROM alpine:3.12
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .

RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001
USER appuser

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3003/health || exit 1

CMD ["./server"]
