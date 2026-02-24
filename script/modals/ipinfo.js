// ========================================
// IP Info Modal
// ========================================
async function openIPInfo() {
  document.getElementById('ip-modal').classList.add('active');

  const IDS = ['ip-address', 'ip-ipv6', 'ip-isp', 'ip-location', 'ip-timezone', 'ip-asn', 'ip-network', 'ip-dns', 'ip-latency', 'ip-vpn'];
  IDS.forEach(id => document.getElementById(id).textContent = 'Loading...');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const [mainRes, ipv6Res] = await Promise.all([
      fetch('https://ipapi.co/json/', { signal: controller.signal }),
      fetch('https://api6.ipify.org?format=json', { signal: controller.signal }).catch(() => null)
    ]);

    clearTimeout(timeoutId);

    const d = await mainRes.json();
    if (d.error) throw new Error(d.reason || 'API error');

    document.getElementById('ip-address').textContent = d.ip || 'Unknown';

    const ipv6Data = ipv6Res ? await ipv6Res.json().catch(() => null) : null;
    document.getElementById('ip-ipv6').textContent = ipv6Data?.ip || 'Not available';

    document.getElementById('ip-isp').textContent = d.org || 'Unknown';
    document.getElementById('ip-location').textContent = [d.city, d.region, d.country_name].filter(Boolean).join(', ') || 'Unknown';
    document.getElementById('ip-timezone').textContent = d.timezone || 'Unknown';
    document.getElementById('ip-asn').textContent = d.asn || 'Unknown';
    document.getElementById('ip-network').textContent = d.org || 'Unknown';
    document.getElementById('ip-dns').textContent = 'Auto-detected';

    // Latency
    const t0 = performance.now();
    await fetch('https://www.cloudflare.com/cdn-cgi/trace', { mode: 'no-cors', cache: 'no-store' });
    document.getElementById('ip-latency').textContent = `${Math.round(performance.now() - t0)}ms`;

    // VPN status ? proxy/hosting are real flags; mobile is just connection type
    const vpnFlags = [];
    if (d.proxy) vpnFlags.push('Proxy detected');
    if (d.hosting) vpnFlags.push('VPN/Hosting');
    const connType = d.mobile ? 'Mobile' : 'Broadband';
    document.getElementById('ip-vpn').textContent = vpnFlags.length
      ? `${vpnFlags.join(', ')} · ${connType}`
      : `Direct · ${connType}`;

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('IP info error:', error);
    document.getElementById('ip-address').textContent = error.message || 'Error';
    IDS.filter(id => id !== 'ip-address').forEach(id => document.getElementById(id).textContent = '?');
  }
}

function closeIPInfo() {
  document.getElementById('ip-modal').classList.remove('active');
}