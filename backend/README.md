# H₂S Guard - Backend Microservices (MySQL 8.0)

Production-grade Spring Boot Microservices Architecture for the H₂S Guard system, backed by local MySQL 8.0 Server and Spring Cloud Gateway.

## Architecture & Technology Stack

- **Framework**: Java 21, Spring Boot 3.3.4, Maven
- **Database**: Local MySQL 8.0 Server (`localhost:3306`, user: `root`, password: `qwerty`)
- **Schema Migrations**: Flyway MySQL (`flyway-mysql`)
- **Security**: Spring Security, JWT (HS256), BCrypt Password Encoder
- **API Documentation**: Springdoc OpenAPI / Swagger UI
- **Gateway**: Spring Cloud Gateway

---

## Service Port Allocation

| Microservice | Port | Database Name | Description |
| :--- | :--- | :--- | :--- |
| `api-gateway` | `8080` | N/A | Central API router & CORS entry point |
| `auth-service` | `8081` | `h2s_auth` | User login, BCrypt verification, JWT tokens |
| `user-service` | `8082` | `h2s_user` | User/Worker profiles & Admin management |
| `exposure-service` | `8083` | `h2s_exposure` | Exposure records, persistent thresholds, consultation workflow |
| `notification-service` | `8084` | `h2s_notification` | User notification feeds & alert dispatch |
| `ai-analysis-service` | `8085` | `h2s_ai` | Multipart image upload REST boundary |

---

## Prerequisites & Database Setup

1. **MySQL Server 8.0**: Ensure local MySQL Server is running on port `3306`.
2. **Databases**:
   ```sql
   CREATE DATABASE IF NOT EXISTS h2s_auth;
   CREATE DATABASE IF NOT EXISTS h2s_user;
   CREATE DATABASE IF NOT EXISTS h2s_exposure;
   CREATE DATABASE IF NOT EXISTS h2s_notification;
   CREATE DATABASE IF NOT EXISTS h2s_ai;
   ```

---

## Building and Testing Services

Each microservice is an independent Maven project:

```powershell
# Build and run tests for each service:
mvn clean test -f backend/auth-service/pom.xml
mvn clean test -f backend/user-service/pom.xml
mvn clean test -f backend/exposure-service/pom.xml
mvn clean test -f backend/notification-service/pom.xml
mvn clean test -f backend/ai-analysis-service/pom.xml
mvn clean test -f backend/api-gateway/pom.xml
```

---

## Running Backend Services

Start each Spring Boot service independently:

```powershell
mvn spring-boot:run -f backend/auth-service/pom.xml
mvn spring-boot:run -f backend/user-service/pom.xml
mvn spring-boot:run -f backend/exposure-service/pom.xml
mvn spring-boot:run -f backend/notification-service/pom.xml
mvn spring-boot:run -f backend/ai-analysis-service/pom.xml
mvn spring-boot:run -f backend/api-gateway/pom.xml
```

---

## Swagger UI Links

- Auth Service: `http://localhost:8081/swagger-ui.html`
- User Service: `http://localhost:8082/swagger-ui.html`
- Exposure Service: `http://localhost:8083/swagger-ui.html`
- Notification Service: `http://localhost:8084/swagger-ui.html`
- AI Analysis Service: `http://localhost:8085/swagger-ui.html`
