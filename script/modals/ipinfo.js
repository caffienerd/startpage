// ========================================
// IP Info Modal
// ========================================
async function openIPInfo() {
  document.getElementById('ip-modal').classList.add('active');

  const IDS = ['ip-address','ip-ipv6','ip-isp','ip-location','ip-timezone','ip-asn','ip-network','ip-dns','ip-latency','ip-vpn'];
  IDS.forEach(id => document.getElementById(id).textContent = '?');

  try {
    const [mainRes, ipv6Res] = await Promise.all([
      fetch('http://ip-api.com/json/?fields=status,message,query,isp,org,as,country,regionName,city,timezone,mobile,proxy,hosting'),
      fetch('https://api6.ipify.org?format=json').catch(() => null)
    ]);

    const d = await mainRes.json();
    if (d.status !== 'success') throw new Error(d.message || 'API error');

    document.getElementById('ip-address').textContent  = d.query || 'Unknown';

    const ipv6Data = ipv6Res ? await ipv6Res.json().catch(() => null) : null;
    document.getElementById('ip-ipv6').textContent     = ipv6Data?.ip || 'Not available';

    document.getElementById('ip-isp').textContent      = d.isp || 'Unknown';
    document.getElementById('ip-location').textContent = [d.city, d.regionName, d.country].filter(Boolean).join(', ') || 'Unknown';
    document.getElementById('ip-timezone').textContent = d.timezone || 'Unknown';
    document.getElementById('ip-asn').textContent      = d.as || 'Unknown';
    document.getElementById('ip-network').textContent  = d.org || 'Unknown';
    document.getElementById('ip-dns').textContent      = 'Auto-detected';

    // Latency
    const t0 = performance.now();
    await fetch('https://www.cloudflare.com/cdn-cgi/trace', { mode: 'no-cors', cache: 'no-store' });
    document.getElementById('ip-latency').textContent  = `${Math.round(performance.now() - t0)}ms`;

    // VPN status ? proxy/hosting are real flags; mobile is just connection type
    const vpnFlags = [];
    if (d.proxy)   vpnFlags.push('Proxy detected');
    if (d.hosting) vpnFlags.push('VPN/Hosting');
    const connType = d.mobile ? 'Mobile' : 'Broadband';
    document.getElementById('ip-vpn').textContent = vpnFlags.length
      ? `${vpnFlags.join(', ')} · ${connType}`
      : `Direct · ${connType}`;

  } catch (error) {
    console.error('IP info error:', error);
    IDS.forEach(id => document.getElementById(id).textContent = 'Error');
  }
}

function closeIPInfo() {
  document.getElementById('ip-modal').classList.remove('active');
}