while ($true) {
    $value = Get-Random -Maximum 100
    $message = "example:$value|c"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($message)
    $udpClient = New-Object System.Net.Sockets.UdpClient
    $udpClient.Connect("localhost", 8125)
    $udpClient.Send($bytes, $bytes.Length)
    $udpClient.Close()
    Start-Sleep -Milliseconds 100
}
