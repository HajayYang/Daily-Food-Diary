param([Parameter(Mandatory=$true)][string]$Installer,[Parameter(Mandatory=$true)][string]$Application,[string]$SigningMode='none',[string]$ExpectedPublisher)
$ErrorActionPreference='Stop'
$company=(Get-Item -LiteralPath $Application).VersionInfo.CompanyName
if($company -cne 'Hangjay-Yang'){throw 'Application author metadata does not match Hangjay-Yang'}
if($SigningMode -eq 'none'){
  Write-Output 'Author metadata: Hangjay-Yang. Authenticode is not configured; do not claim a verified Windows publisher.'
  exit 0
}
if($SigningMode -ne 'azure' -or -not $ExpectedPublisher){throw 'Invalid signing verification configuration'}
foreach($path in @($Installer,$Application)){
  $signature=Get-AuthenticodeSignature -LiteralPath $path
  if($signature.Status -ne 'Valid'){throw "Authenticode verification failed: $($signature.Status)"}
  $publisher=$signature.SignerCertificate.GetNameInfo([System.Security.Cryptography.X509Certificates.X509NameType]::SimpleName,$false)
  if($publisher -cne $ExpectedPublisher){throw 'Certificate publisher does not match the configured verified identity'}
  if(-not $signature.TimeStamperCertificate){throw 'Missing trusted timestamp'}
}
Write-Output 'Authenticode certificate chain, publisher and timestamp verified for installer and application.'
