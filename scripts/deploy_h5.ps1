param(
    [string]$HostName = "74.176.80.124",
    [string]$User = "yeenjia",
    [int]$SshPort = 22,
    [int]$HttpPort = 8089,
    [string]$RemoteDir = "/home/yeenjia/foodseek-h5",
    [string]$KeyPath = "",
    [switch]$StartRemoteService
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$BundlePath = Join-Path $Root "dist\foodseek"
$Remote = "${User}@${HostName}"

function SshArgs {
    $args = @("-p", "$SshPort")
    if ($KeyPath) {
        $args += @("-i", $KeyPath)
    }
    $args += @("-o", "IdentitiesOnly=yes")
    return $args
}

function ScpArgs {
    $args = @("-P", "$SshPort")
    if ($KeyPath) {
        $args += @("-i", $KeyPath)
    }
    $args += @("-o", "IdentitiesOnly=yes")
    return $args
}

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$FilePath failed with exit code $LASTEXITCODE"
    }
}

Write-Host "Building H5 bundle..."
python (Join-Path $Root "scripts\build_h5_bundle.py")

Write-Host "Creating remote directory $RemoteDir/current ..."
$sshArgs = SshArgs
Invoke-Native ssh @sshArgs $Remote "mkdir -p '$RemoteDir/current'"

Write-Host "Uploading files to ${Remote}:$RemoteDir/current ..."
$items = Get-ChildItem -LiteralPath $BundlePath -Force | ForEach-Object { $_.FullName }
$scpArgs = ScpArgs
Invoke-Native scp @scpArgs @items "${Remote}:$RemoteDir/current/"

if ($StartRemoteService) {
    Write-Host "Uploading remote start script..."
    $remoteScript = "$RemoteDir/remote_start_foodseek.sh"
    Invoke-Native scp @scpArgs (Join-Path $Root "deploy\remote_start_foodseek.sh") "${Remote}:$remoteScript"
    Invoke-Native ssh @sshArgs $Remote "chmod +x '$remoteScript' && bash '$remoteScript' '$RemoteDir' '$HttpPort'"
} else {
    Write-Host "Uploaded only. To start the service later, rerun with -StartRemoteService."
}

Write-Host "Done: http://$HostName`:$HttpPort"
