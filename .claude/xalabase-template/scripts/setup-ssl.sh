#!/bin/bash
# =============================================================================
# SSL Setup Script for Hostinger Subdomains
# Uses Let's Encrypt with Certbot + A+ SSL Labs Configuration
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load configuration
if [ -f "$SCRIPT_DIR/deploy-config.sh" ]; then
    source "$SCRIPT_DIR/deploy-config.sh"
else
    echo -e "${RED}Error: deploy-config.sh not found!${NC}"
    exit 1
fi

print_status() {
    echo -e "${BLUE}[SSL]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# SSH into Hostinger and run certbot with A+ config
setup_ssl() {
    print_status "Connecting to Hostinger to setup SSL with A+ configuration..."

    ssh -t -p "$HOSTINGER_PORT" "$HOSTINGER_USER@$HOSTINGER_HOST" << 'REMOTE_SCRIPT'
set -e

echo "=== SSL Setup with A+ Configuration ==="

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Domains
WEB_DOMAIN="web-test.digilist.no"
BACKOFFICE_DOMAIN="backoffice-test.digilist.no"
MINSIDE_DOMAIN="minside-test.digilist.no"

echo "Setting up SSL for:"
echo "  - $WEB_DOMAIN"
echo "  - $BACKOFFICE_DOMAIN"
echo "  - $MINSIDE_DOMAIN"

# Generate strong DH parameters if not exists (takes a few minutes first time)
if [ ! -f /etc/ssl/certs/dhparam.pem ]; then
    echo "Generating DH parameters (this may take a few minutes)..."
    openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
fi

# Request certificates
certbot --nginx \
    -d "$WEB_DOMAIN" \
    -d "$BACKOFFICE_DOMAIN" \
    -d "$MINSIDE_DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email admin@digilist.no \
    --redirect

# Create A+ SSL configuration snippet
cat > /etc/nginx/snippets/ssl-params.conf << 'SSLCONF'
# SSL Session Settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# Modern TLS only (TLS 1.2 and 1.3)
ssl_protocols TLSv1.2 TLSv1.3;

# Strong cipher suites (A+ compatible)
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# DH parameters
ssl_dhparam /etc/ssl/certs/dhparam.pem;

# HSTS (31536000 seconds = 1 year) - Required for A+
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Additional Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;
SSLCONF

echo "Created SSL params snippet at /etc/nginx/snippets/ssl-params.conf"

# Update nginx configs to include SSL params
for domain in "$WEB_DOMAIN" "$BACKOFFICE_DOMAIN" "$MINSIDE_DOMAIN"; do
    CONF_FILE="/etc/nginx/sites-available/$domain"
    if [ -f "$CONF_FILE" ]; then
        # Check if ssl-params.conf is already included
        if ! grep -q "ssl-params.conf" "$CONF_FILE"; then
            # Add include after ssl_certificate lines
            sed -i '/ssl_certificate/a\    include /etc/nginx/snippets/ssl-params.conf;' "$CONF_FILE"
            echo "Added SSL params to $CONF_FILE"
        fi
    fi
done

# Also check sites-enabled for certbot-created configs
for conf in /etc/nginx/sites-enabled/*; do
    if [ -f "$conf" ] && grep -q "ssl_certificate" "$conf"; then
        if ! grep -q "ssl-params.conf" "$conf"; then
            sed -i '/ssl_certificate/a\    include /etc/nginx/snippets/ssl-params.conf;' "$conf"
            echo "Added SSL params to $conf"
        fi
    fi
done

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx

# Set up auto-renewal
echo "Setting up certificate auto-renewal..."
systemctl enable certbot.timer 2>/dev/null || true
systemctl start certbot.timer 2>/dev/null || true

echo ""
echo "=== SSL Setup Complete ==="
echo ""
echo "Certificates installed for:"
echo "  - https://$WEB_DOMAIN"
echo "  - https://$BACKOFFICE_DOMAIN"
echo "  - https://$MINSIDE_DOMAIN"
echo ""
echo "Configuration includes:"
echo "  ✓ TLS 1.2 and TLS 1.3 only"
echo "  ✓ Strong cipher suites"
echo "  ✓ HSTS with preload (1 year)"
echo "  ✓ OCSP stapling"
echo "  ✓ 2048-bit DH parameters"
echo "  ✓ Security headers"
echo ""
echo "Test your SSL rating at: https://www.ssllabs.com/ssltest/"
REMOTE_SCRIPT

    print_success "SSL certificates installed with A+ configuration!"
    echo ""
    echo "Your sites are now available via HTTPS:"
    echo "  - https://${WEB_SUBDOMAIN}.${DOMAIN_BASE}"
    echo "  - https://${BACKOFFICE_SUBDOMAIN}.${DOMAIN_BASE}"
    echo "  - https://${MINSIDE_SUBDOMAIN}.${DOMAIN_BASE}"
    echo ""
    echo "Verify A+ rating at: https://www.ssllabs.com/ssltest/analyze.html?d=${WEB_SUBDOMAIN}.${DOMAIN_BASE}"
}

# Main
main() {
    print_status "SSL Setup for Hostinger Subdomains (A+ Configuration)"
    echo ""
    print_warning "This script will:"
    echo "  1. Install Let's Encrypt certificates"
    echo "  2. Configure TLS 1.2/1.3 only (no legacy protocols)"
    echo "  3. Set strong cipher suites"
    echo "  4. Enable HSTS with 1-year max-age"
    echo "  5. Enable OCSP stapling"
    echo "  6. Generate 2048-bit DH parameters"
    echo ""
    print_warning "Requirements:"
    echo "  - Root/sudo access on the server"
    echo "  - Nginx installed"
    echo "  - A records pointing to server IP"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    else
        echo "Aborted."
        exit 0
    fi
}

main "$@"
