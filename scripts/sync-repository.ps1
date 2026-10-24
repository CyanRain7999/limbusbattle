param([string]$Destination = 'D:\G\limbusbattle')
$ErrorActionPreference = 'Stop'
$sourcePath = [IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent)).TrimEnd('\')
$destinationPath = [IO.Path]::GetFullPath($Destination).TrimEnd('\')
if ($sourcePath -eq $destinationPath) { Write-Output 'Already working in the GitHub Desktop repository; no copy needed.'; exit 0 }
if ($destinationPath -ne 'D:\G\limbusbattle') { throw 'Destination must be the repository explicitly selected by the user: D:\G\limbusbattle' }
if (-not (Test-Path -LiteralPath (Join-Path $destinationPath '.git'))) { throw 'Destination must already be a Git repository. Its .git is never copied or modified.' }
$manifestPath = Join-Path $destinationPath '.codex-sync-manifest.json'
$previous = @{}
if (Test-Path -LiteralPath $manifestPath) {
  $parsed = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  foreach ($property in $parsed.files.PSObject.Properties) { $previous[$property.Name] = $property.Value }
}
$excluded = @('.git','node_modules','.cache','dist','test-results','playwright-report','.playwright-mcp','.openai','release','__pycache__')
$files = [Collections.Generic.List[IO.FileInfo]]::new()
function Read-ProjectFiles([string]$folder) {
  foreach ($item in Get-ChildItem -LiteralPath $folder -Force) {
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
    if ($item.PSIsContainer) { if ($excluded -notcontains $item.Name) { Read-ProjectFiles $item.FullName } }
    elseif ($item.Name -ne '.codex-sync-manifest.json' -and $item.Extension -ne '.log') { $files.Add($item) }
  }
}
Read-ProjectFiles $sourcePath
$plans = @(); $conflicts = @(); $newManifest = @{}
foreach ($file in $files) {
  $relative = $file.FullName.Substring($sourcePath.Length + 1)
  $target = [IO.Path]::GetFullPath((Join-Path $destinationPath $relative))
  if (-not $target.StartsWith($destinationPath + '\',[StringComparison]::OrdinalIgnoreCase)) { throw 'A target escaped the selected repository.' }
  $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
  $newManifest[$relative] = $hash
  if (Test-Path -LiteralPath $target) {
    $destinationHash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    if ($destinationHash -eq $hash) { continue }
    if (-not $previous.ContainsKey($relative) -or $destinationHash -ne $previous[$relative]) { $conflicts += $relative; continue }
  }
  $plans += @{Source=$file.FullName;Target=$target;Hash=$hash}
}
if ($conflicts.Count) { throw ('Destination has unsynchronized user edits; no files copied. Resolve these first: ' + ($conflicts -join ', ')) }
foreach ($plan in $plans) {
  New-Item -ItemType Directory -Path (Split-Path $plan.Target -Parent) -Force | Out-Null
  Copy-Item -LiteralPath $plan.Source -Destination $plan.Target -Force
  if ((Get-FileHash -LiteralPath $plan.Target -Algorithm SHA256).Hash -ne $plan.Hash) { throw "Hash verification failed: $($plan.Target)" }
}
@{source=$sourcePath;destination=$destinationPath;updated=(Get-Date -Format o);files=$newManifest} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding utf8
Write-Output ("Synchronized {0} changed files; verified {1} project files. Git metadata and unrelated files preserved." -f $plans.Count,$files.Count)
