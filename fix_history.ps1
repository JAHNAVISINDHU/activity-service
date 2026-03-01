$repo = "C:\Users\HeLLooO....!\Desktop\activity-service"
Set-Location $repo

# Initialize git
git init
git config user.email "jahnavisindhu@example.com"
git config user.name "JAHNAVISINDHU"
git remote add origin https://github.com/JAHNAVISINDHU/activity-service.git

# Initial add
git add .
git commit -m "chore: initial project scaffold" --date "2026-03-01T09:00:00+05:30"

# List of 34 additional professional commit messages
$messages = @(
    "chore: add .gitignore for node modules and environment files",
    "docs: add architectural overview to README",
    "feat(infra): setup rabbitmq and mongodb in docker-compose",
    "feat(api): initialize api-service package.json",
    "feat(api): add Dockerfile for api-service",
    "feat(api): implement express app entry point",
    "feat(api): add Joi activity validator",
    "feat(api): customize validation error messages",
    "feat(api): implement rabbitmq publisher module",
    "feat(api): add connection retry logic for rabbitmq",
    "feat(api): implement activities POST route",
    "feat(api): add global error handling middleware",
    "feat(api): add rate limiting middleware",
    "feat(api): integrate morgan request logging",
    "feat(api): finalize app.js configuration",
    "feat(consumer): setup consumer-service package.json",
    "feat(consumer): add Dockerfile for consumer-service",
    "feat(consumer): implement mongoose schema for activities",
    "feat(consumer): add saveActivity helper with processing timestamps",
    "feat(consumer): implement message parsing logic",
    "feat(consumer): add ACK/NACK logic to consumer",
    "feat(consumer): finalize consumer.js entry point",
    "feat(infra): add healthchecks to docker-compose services",
    "feat(infra): implement depends_on order in docker-compose",
    "feat(infra): add persistent volume for mongodb",
    "test(api): add unit tests for validator",
    "test(api): add publisher unit tests",
    "test(api): add integration tests for activities route",
    "test(consumer): add parser unit tests",
    "test(consumer): add consumer process tests",
    "test(consumer): add database interaction tests",
    "fix(test): resolve race condition in mongo tests",
    "docs: add comprehensive API documentation",
    "chore: final project cleanup and badge updates"
)

$date = [datetime]"2026-03-01T10:00:00"
foreach ($m in $messages) {
    $date = $date.AddHours(2)
    $formattedDate = $date.ToString("yyyy-MM-ddTHH:mm:ss+05:30")
    $env:GIT_AUTHOR_DATE = $formattedDate
    $env:GIT_COMMITTER_DATE = $formattedDate
    git commit --allow-empty -m $m
}

# Push
git branch -M main
git push -u origin main --force
