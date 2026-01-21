#!/bin/bash

# Deployment Script untuk Cloud-Native Consearch App
# Supports: Docker Compose dan Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker installed: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose installed: $(docker-compose --version)"
}

# Generate SSL certificates
generate_ssl_certs() {
    print_header "Generating SSL Certificates"
    
    mkdir -p ssl
    
    if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
        print_warning "SSL certificates already exist"
    else
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem \
            -days 365 -nodes \
            -subj "/C=ID/ST=State/L=City/O=Organization/CN=consearch-app"
        print_success "SSL certificates generated"
    fi
}

# Create .env file
create_env_file() {
    print_header "Creating Environment Configuration"
    
    if [ ! -f ".env" ]; then
        cat > .env <<EOF
# Database Configuration
POSTGRES_USER=consearch_user
POSTGRES_PASSWORD=consearch_password_change_in_production
POSTGRES_DB=consearch_db

# Node.js Configuration
NODE_ENV=development
LOG_LEVEL=info

# JWT & Session
JWT_SECRET=your-jwt-secret-key-change-in-production
SESSION_SECRET=your-session-secret-key-change-in-production

# Grafana
GF_SECURITY_ADMIN_PASSWORD=admin
GF_SECURITY_ADMIN_USER=admin
EOF
        print_success ".env file created"
        print_warning "⚠️  Please update the .env file with your own secrets before deploying to production!"
    else
        print_warning ".env file already exists"
    fi
}

# Deploy with Docker Compose
deploy_docker_compose() {
    print_header "Deploying with Docker Compose"
    
    docker-compose -f docker-compose.prod.yml down || true
    sleep 2
    
    docker-compose -f docker-compose.prod.yml build
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Docker Compose deployment completed"
    
    echo ""
    echo -e "${BLUE}Services are now running:${NC}"
    echo "  - Backend API: http://localhost:3000"
    echo "  - Frontend (via Nginx): http://localhost:80"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001 (admin/admin)"
    echo "  - AlertManager: http://localhost:9093"
    echo "  - PostgreSQL: localhost:5432"
    echo ""
}

# Check Kubernetes
check_kubernetes() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        return 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Kubernetes cluster is not accessible"
        return 1
    fi
    
    print_success "Kubernetes cluster is accessible"
    return 0
}

# Deploy to Kubernetes
deploy_kubernetes() {
    print_header "Deploying to Kubernetes"
    
    if ! check_kubernetes; then
        print_error "Kubernetes is not available. Skipping Kubernetes deployment."
        return 1
    fi
    
    print_warning "Building Docker image for Kubernetes..."
    docker build -f Dockerfile.prod -t consearch/backend:latest .
    
    print_warning "Applying Kubernetes manifests..."
    
    kubectl apply -f k8s/00-namespace-configmap.yaml
    sleep 2
    
    kubectl apply -f k8s/01-postgres.yaml
    sleep 5
    
    kubectl apply -f k8s/02-backend.yaml
    sleep 3
    
    kubectl apply -f k8s/03-nginx.yaml
    kubectl apply -f k8s/04-prometheus.yaml
    kubectl apply -f k8s/05-grafana.yaml
    kubectl apply -f k8s/06-alertmanager.yaml
    
    print_success "Kubernetes deployment completed"
    
    echo ""
    echo -e "${BLUE}Checking deployment status...${NC}"
    kubectl -n consearch get pods
    echo ""
    echo -e "${BLUE}Services in Kubernetes:${NC}"
    kubectl -n consearch get svc
    echo ""
}

# Health check
health_check() {
    print_header "Running Health Checks"
    
    echo "Waiting for services to be ready..."
    sleep 5
    
    # Check Backend
    if curl -f http://localhost:3000/health 2>/dev/null; then
        print_success "Backend API is healthy"
    else
        print_warning "Backend API is not responding yet"
    fi
    
    # Check Nginx
    if curl -f http://localhost:80/health 2>/dev/null; then
        print_success "Nginx is healthy"
    else
        print_warning "Nginx is not responding yet"
    fi
    
    # Check Prometheus
    if curl -f http://localhost:9090/-/healthy 2>/dev/null; then
        print_success "Prometheus is healthy"
    else
        print_warning "Prometheus is not responding yet"
    fi
}

# Display usage info
show_usage() {
    cat <<EOF
Usage: ./deploy.sh [option]

Options:
    docker-compose    Deploy using Docker Compose (development/staging)
    kubernetes        Deploy to Kubernetes cluster (production)
    all               Deploy both Docker Compose and Kubernetes
    cleanup           Remove all containers and volumes
    help              Show this help message

Examples:
    ./deploy.sh docker-compose
    ./deploy.sh kubernetes
    ./deploy.sh all

Environment:
    Create a .env file to configure environment variables
    See .env.example for available options
EOF
}

# Main script
main() {
    local deployment_type="${1:-docker-compose}"
    
    case $deployment_type in
        docker-compose)
            check_prerequisites
            generate_ssl_certs
            create_env_file
            deploy_docker_compose
            health_check
            ;;
        kubernetes)
            check_prerequisites
            deploy_kubernetes
            ;;
        all)
            check_prerequisites
            generate_ssl_certs
            create_env_file
            deploy_docker_compose
            health_check
            deploy_kubernetes
            ;;
        cleanup)
            print_header "Cleaning up"
            docker-compose -f docker-compose.prod.yml down -v
            print_success "Docker Compose cleanup completed"
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown option: $deployment_type"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
