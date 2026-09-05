$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$pages = Get-ChildItem -Path $root -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch '\\node_modules\\' }
$issues = @()

# Known-intentional pages: search-engine verification stubs, 404, and the
# tovary/ + uslugi/ redirect stubs added 3 June (they canonical to the real page on purpose)
$skip = @('404.html','google92049c5efe7c59b3.html','yandex_e2838f95616f8633.html')
$isService = { param($r) $r -in $skip -or $r -match '^(tovary|uslugi)[\\/]' }

foreach ($p in $pages) {
    $rel = $p.FullName.Substring($root.Length + 1)
    $t = Get-Content $p.FullName -Raw -Encoding UTF8
    $dir = $p.DirectoryName

    $service = & $isService $rel
    if (-not $service) {
        if ($t -notmatch '<title>[^<]+</title>')                 { $issues += "$rel :: no <title>" }
        if ($t -notmatch 'name="description"\s+content="[^"]+"')  { $issues += "$rel :: no description" }
        if ($t -notmatch 'rel="canonical"')                       { $issues += "$rel :: no canonical" }
    }

    if (-not $service -and $t -match 'rel="canonical"\s+href="https://yugstroysegment\.com/([^"]*)"') {
        $canon = $Matches[1]
        $expect = ($rel -replace '\\','/')
        if ($canon -ne $expect -and $expect -ne 'index.html') {
            $issues += "$rel :: canonical points to '$canon'"
        }
    }

    foreach ($m in [regex]::Matches($t, '(?s)<script type="application/ld\+json">(.*?)</script>')) {
        try { $null = $m.Groups[1].Value | ConvertFrom-Json }
        catch { $issues += "$rel :: broken JSON-LD" }
    }

    foreach ($m in [regex]::Matches($t, 'href="(?!https?:|tel:|mailto:|#)([^"#?]+)')) {
        $href = $m.Groups[1].Value
        if ($href -eq '') { continue }
        # attribute uses %20 for spaces: decode only after the value is isolated
        $href = [uri]::UnescapeDataString($href)
        if (-not (Test-Path -LiteralPath (Join-Path $dir $href))) { $issues += "$rel :: dead link -> $href" }
    }

    # src holds ONE url and may contain literal spaces -> never split it
    foreach ($m in [regex]::Matches($t, '\ssrc="(?!https?:|data:)([^"]+)"')) {
        $f = [uri]::UnescapeDataString($m.Groups[1].Value.Trim())
        if ($f -eq '') { continue }
        if (-not (Test-Path -LiteralPath (Join-Path $dir $f))) { $issues += "$rel :: missing file -> $f" }
    }

    # srcset is a comma-separated list; spaces inside names are %20-encoded,
    # so strip only a trailing 400w / 2x descriptor
    foreach ($m in [regex]::Matches($t, 'srcset="(?!https?:|data:)([^"]+)"')) {
        foreach ($cand in ($m.Groups[1].Value -split ',')) {
            $f = ($cand.Trim() -replace '\s+\d+(\.\d+)?[wx]$','')
            if ($f -eq '') { continue }
            $f = [uri]::UnescapeDataString($f)
            if (-not (Test-Path -LiteralPath (Join-Path $dir $f))) { $issues += "$rel :: missing file (srcset) -> $f" }
        }
    }
}

[xml]$sm = Get-Content (Join-Path $root 'sitemap.xml') -Raw
$locs = $sm.urlset.url | ForEach-Object { $_.loc }
foreach ($l in $locs) {
    $f = $l -replace 'https://yugstroysegment\.com/',''
    if ($f -eq '') { $f = 'index.html' }
    if (-not (Test-Path -LiteralPath (Join-Path $root ($f -replace '/','\')))) { $issues += "sitemap.xml :: url without file -> $f" }
}
foreach ($d in ($locs | Group-Object | Where-Object Count -gt 1)) { $issues += "sitemap.xml :: duplicate url -> $($d.Name)" }

$inMap = $locs | ForEach-Object { ($_ -replace 'https://yugstroysegment\.com/','') }
foreach ($p in $pages) {
    $rel = ($p.FullName.Substring($root.Length + 1)) -replace '\\','/'
    if ($inMap -notcontains $rel -and $rel -ne 'index.html' -and -not (& $isService ($rel -replace '/','\'))) {
        $issues += "sitemap.xml :: page not in sitemap -> $rel"
    }
}

"Pages checked: $($pages.Count)"
"Sitemap urls:  $($locs.Count)"
"Issues:        $($issues.Count)"
if ($issues.Count) { ""; $issues | Sort-Object | ForEach-Object { "  $_" } }
