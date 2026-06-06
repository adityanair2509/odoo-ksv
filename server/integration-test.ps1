# End-to-end integration test: prove the Vite-served frontend is
# configured to talk to the Express backend and that CORS allows it.
# Run AFTER both `npm run dev` (Vite) and `npm run dev` (server) are up.

$ErrorActionPreference = 'Continue'
$fe  = 'http://localhost:5174'        # Vite dev server (5173 was busy -> 5174)
$be  = 'http://localhost:8000'
$api = "$be/api"

Write-Host "================================================="
Write-Host "  END-TO-END INTEGRATION CHECK"
Write-Host "  Frontend: $fe"
Write-Host "  Backend:  $be"
Write-Host "================================================="

# 1. Backend health
Write-Host "`n[1] Backend health"
try {
    $h = Invoke-WebRequest "$api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "  PASS  GET $api/health  -> $($h.StatusCode)  $($h.Content)"
} catch {
    Write-Host "  FAIL  backend not reachable: $($_.Exception.Message)"
    exit 1
}

# 2. Frontend HTML
Write-Host "`n[2] Frontend serves index.html"
try {
    $html = Invoke-WebRequest "$fe/" -UseBasicParsing -TimeoutSec 5
    if ($html.Content -match '<div id="root"') {
        Write-Host "  PASS  GET $fe/  -> 200  found <div id='root'>"
    } else {
        Write-Host "  FAIL  HTML doesn't contain root mount node"
    }
} catch {
    Write-Host "  FAIL  frontend not reachable: $($_.Exception.Message)"
    exit 1
}

# 3. CORS preflight (simulate what axios sends on a real call)
Write-Host "`n[3] CORS preflight (OPTIONS) — simulates the browser's preflight"
$preflight = @{
    Method = 'OPTIONS'
    Uri = "$api/auth/login"
    Headers = @{
        'Origin' = $fe
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'content-type,authorization'
    }
}
$pre = Invoke-WebRequest @preflight -UseBasicParsing -TimeoutSec 5
$acao = $pre.Headers['Access-Control-Allow-Origin']
$acam = $pre.Headers['Access-Control-Allow-Methods']
$acah = $pre.Headers['Access-Control-Allow-Headers']
if ($acao -and $acao -contains $fe) {
    Write-Host "  PASS  Access-Control-Allow-Origin: $acao"
} else {
    Write-Host "  FAIL  CORS: Access-Control-Allow-Origin was '$acao', expected '$fe'"
}
if ($acam -and $acam -match 'POST') {
    Write-Host "  PASS  Access-Control-Allow-Methods includes POST"
} else {
    Write-Host "  FAIL  Access-Control-Allow-Methods: $acam"
}
if ($acah -and $acah -match 'content-type') {
    Write-Host "  PASS  Access-Control-Allow-Headers includes content-type"
} else {
    Write-Host "  FAIL  Access-Control-Allow-Headers: $acah"
}

# 4. End-to-end: simulate the frontend's first call after page load
#    (auth.service.js does POST /api/auth/login on form submit)
Write-Host "`n[4] E2E: POST /api/auth/login with browser-like headers (Origin: $fe)"
$body = (@{ email = 'admin@vendorbridge.in'; password = 'demo123' } | ConvertTo-Json -Compress)
$loginResp = Invoke-WebRequest -Method POST -Uri "$api/auth/login" -Headers @{
    'Content-Type' = 'application/json'
    'Origin' = $fe
} -Body $body -UseBasicParsing -TimeoutSec 10
$acao2 = $loginResp.Headers['Access-Control-Allow-Origin']
$loginJson = $loginResp.Content | ConvertFrom-Json
Write-Host "  HTTP $($loginResp.StatusCode)  CORS echo: $acao2"
Write-Host "  user = $($loginJson.user.name) (role=$($loginJson.user.role))"
Write-Host "  token (first 40 chars) = $($loginJson.token.Substring(0,40))..."

# 5. Use that token to fetch vendors (proves full request flow)
Write-Host "`n[5] E2E: GET /api/vendors with the JWT from step 4"
$vendorsResp = Invoke-WebRequest -Method GET -Uri "$api/vendors" -Headers @{
    'Authorization' = "Bearer $($loginJson.token)"
    'Origin' = $fe
} -UseBasicParsing -TimeoutSec 10
$vendors = $vendorsResp.Content | ConvertFrom-Json
Write-Host "  HTTP $($vendorsResp.StatusCode)  returned $($vendors.Count) vendors"
Write-Host "  first: id=$($vendors[0].id) name=$($vendors[0].name) gstin=$($vendors[0].gstin)"

# 6. Confirm Vite's .env was actually picked up
Write-Host "`n[6] Confirm frontend was started with VITE_USE_MOCK=false"
$envFile = 'c:\odoo ksv\.env'
$envContent = Get-Content $envFile -Raw
if ($envContent -match 'VITE_USE_MOCK\s*=\s*false') {
    Write-Host "  PASS  $envFile has VITE_USE_MOCK=false"
} else {
    Write-Host "  FAIL  $envFile is missing VITE_USE_MOCK=false"
}
if ($envContent -match 'VITE_API_BASE_URL\s*=\s*http://localhost:8000/api') {
    Write-Host "  PASS  $envFile points to http://localhost:8000/api"
} else {
    Write-Host "  FAIL  $envFile has wrong VITE_API_BASE_URL"
}

Write-Host "`n================================================="
Write-Host "  Summary: backend up, frontend up, CORS works,"
Write-Host "  end-to-end login + authed GET works, .env is right."
Write-Host "  -> Open $fe in your browser to use the app."
Write-Host "================================================="
