$ErrorActionPreference = 'Continue'
$api = 'http://localhost:8000/api'

function Call($method, $path, $token, $body) {
    $h = @{ 'Content-Type' = 'application/json' }
    if ($token) { $h['Authorization'] = "Bearer $token" }
    $params = @{
        Method = $method
        Uri = "$api$path"
        Headers = $h
        TimeoutSec = 10
    }
    if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 10 -Compress) }
    try {
        $resp = Invoke-WebRequest @params -UseBasicParsing
        $code = [int]$resp.StatusCode
        $data = $resp.Content
        if ($data.Length -gt 250) { $data = $data.Substring(0, 250) + '...' }
        return @{ status = $code; data = $data }
    } catch {
        $resp = $_.Exception.Response
        $code = if ($resp) { [int]$resp.StatusCode } else { 0 }
        $body_text = ''
        try {
            $stream = $resp.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body_text = $reader.ReadToEnd()
        } catch {}
        return @{ status = $code; data = $body_text }
    }
}

function Login($email) {
    # Don't truncate the response — we need the full token.
    $h = @{ 'Content-Type' = 'application/json' }
    $body = (@{ email = $email; password = 'demo123' } | ConvertTo-Json -Compress)
    $resp = Invoke-WebRequest -Method POST -Uri "$api/auth/login" -Headers $h -Body $body -UseBasicParsing -TimeoutSec 10
    if ($resp.StatusCode -ne 200) { throw "login failed for $email : $($resp.StatusCode) $($resp.Content)" }
    return ($resp.Content | ConvertFrom-Json).token
}

$admin  = Login 'admin@vendorbridge.in'
$mgr    = Login 'manager@vendorbridge.in'
$vendor = Login 'vendor@vendorbridge.in'

$tests = @(
    # name, method, path, token, body, expected_status
    @{ n='1.Health';                  m='GET';   p='/health';                          t=$null;     b=$null;                           e=200 },
    @{ n='2./auth/me admin';          m='GET';   p='/auth/me';                         t=$admin;    b=$null;                           e=200 },
    @{ n='3.Bad login';               m='POST';  p='/auth/login';                      t=$null;     b=@{ email='admin@vendorbridge.in'; password='wrong' }; e=401 },
    @{ n='4./vendors list';           m='GET';   p='/vendors';                         t=$admin;    b=$null;                           e=200 },
    @{ n='5./vendors/v1';             m='GET';   p='/vendors/v1';                      t=$admin;    b=$null;                           e=200 },
    @{ n='6.GSTIN valid';             m='POST';  p='/vendors/verify-gstin';            t=$admin;    b=@{ gstin='27AACCI1234A1Z5' };     e=200 },
    @{ n='7.GSTIN invalid';           m='POST';  p='/vendors/verify-gstin';            t=$admin;    b=@{ gstin='99INVALID999999' };    e=200 },
    @{ n='8./rfqs list';              m='GET';   p='/rfqs';                            t=$admin;    b=$null;                           e=200 },
    @{ n='9./rfqs/rfq1';              m='GET';   p='/rfqs/rfq1';                       t=$admin;    b=$null;                           e=200 },
    @{ n='10./quotations/rfqs/rfq1';  m='GET';   p='/quotations/rfqs/rfq1/quotations'; t=$admin;   b=$null;                           e=200 },
    @{ n='11./purchase-orders list';  m='GET';   p='/purchase-orders';                 t=$admin;    b=$null;                           e=200 },
    @{ n='12./invoices/po/po2';       m='GET';   p='/invoices/po/po2';                 t=$admin;    b=$null;                           e=200 },
    @{ n='13./approvals list';        m='GET';   p='/approvals';                       t=$admin;    b=$null;                           e=200 },
    @{ n='14.mark-paid admin';        m='POST';  p='/purchase-orders/po2/mark-paid';   t=$admin;    b=$null;                           e=200 },
    @{ n='15.approve manager';        m='POST';  p='/approvals/ap1/approve';           t=$mgr;      b=@{ remarks='Approved' };        e=200 },
    @{ n='16.vendor mark-paid 403';   m='POST';  p='/purchase-orders/po3/mark-paid';   t=$vendor;   b=$null;                           e=403 },
    @{ n='17.no token 401';           m='GET';   p='/vendors';                         t=$null;     b=$null;                           e=401 },
    @{ n='18.bad body 400';           m='POST';  p='/auth/login';                      t=$null;     b=@{ email='bad'; password='' };  e=400 },
    @{ n='19.404 unknown route';      m='GET';   p='/does-not-exist';                  t=$admin;    b=$null;                           e=404 },
    @{ n='20.404 vendor/v999';        m='GET';   p='/vendors/v999';                    t=$admin;    b=$null;                           e=404 }
)

$pass = 0
$fail = 0
foreach ($t in $tests) {
    $r = Call $t.m $t.p $t.t $t.b
    $is_ok = ($r.status -eq $t.e)
    $tag = if ($is_ok) { 'PASS' } else { 'FAIL' }
    if ($is_ok) { $pass++ } else { $fail++ }
    $expect = if ($t.e -lt 400) { '2xx' } else { $t.e }
    Write-Host ("[{0}] {1,-30} -> {2} (expected {3}) | {4}" -f $tag, $t.n, $r.status, $expect, $r.data)
}
Write-Host ""
Write-Host "=========================="
Write-Host "PASSED: $pass"
Write-Host "FAILED: $fail"
Write-Host "=========================="
