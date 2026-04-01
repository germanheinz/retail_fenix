FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o catalog ./main.go

FROM alpine:3.19 AS runner
WORKDIR /app
COPY --from=builder /app/catalog .
EXPOSE 8080
CMD ["./catalog"]
