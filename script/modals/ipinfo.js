// ========================================
// IP Info Modal
// ========================================
async function openIPInfo() {
  document.getElementById('ip-modal').classList.add('active');

  const IDS = ['ip-address', 'ip-ipv6', 'ip-isp', 'ip-location', 'ip-timezone', 'ip-asn', 'ip-network', 'ip-dns', 'ip-latency', 'ip-vpn'];
  IDS.forEach(id => document.getElementById(id).textContent = 'Loading...');

  // Three separate controllers — each endpoint is protocol-locked
  const mainController = new AbortController();
  const ipv4Controller  = new AbortController();
  const ipv6Controller  = new AbortController();
  const mainTimeout = setTimeout(() => mainController.abort(), 6000);
  const ipv4Timeout = setTimeout(() => ipv4Controller.abort(), 5000);
  const ipv6Timeout = setTimeout(() => ipv6Controller.abort(), 5000);

  try {
    // ipapi.co  → metadata (ISP, location, ASN, etc.)
    // v4.ident.me → responds ONLY over IPv4, returns raw IPv4 string
    // v6.ident.me → responds ONLY over IPv6, returns raw IPv6 string
    const [mainRes, ipv4Res, ipv6Res] = await Promise.all([
      fetch('https://ipapi.co/json/', { signal: mainController.signal }),
      fetch('https://v4.ident.me/', { signal: ipv4Controller.signal }).catch(() => null),
      fetch('https://v6.ident.me/', { signal: ipv6Controller.signal }).catch(() => null)
    ]);

    clearTimeout(mainTimeout);
    clearTimeout(ipv4Timeout);
    clearTimeout(ipv6Timeout);

    const d = await mainRes.json();
    if (d.error) throw new Error(d.reason || 'API error');

    // IPv4 — from protocol-locked v4 endpoint, fallback to ipapi.co
    let ipv4 = 'Not available';
    if (ipv4Res && ipv4Res.ok) {
      const raw = (await ipv4Res.text()).trim();
      if (raw && raw.includes('.')) ipv4 = raw; // must look like an IPv4
    }
    if (ipv4 === 'Not available') ipv4 = d.ip || 'Unknown';
    document.getElementById('ip-address').textContent = ipv4;

    // IPv6 — from protocol-locked v6 endpoint only
    let ipv6 = 'Not available';
    if (ipv6Res && ipv6Res.ok) {
      const raw = (await ipv6Res.text()).trim();
      if (raw && raw.includes(':')) ipv6 = raw; // must look like an IPv6
    }
    document.getElementById('ip-ipv6').textContent = ipv6;

    document.getElementById('ip-isp').textContent      = d.org || 'Unknown';
    document.getElementById('ip-location').textContent = [d.city, d.region, d.country_name].filter(Boolean).join(', ') || 'Unknown';
    document.getElementById('ip-timezone').textContent = d.timezone || 'Unknown';
    document.getElementById('ip-asn').textContent      = d.asn || 'Unknown';
    document.getElementById('ip-network').textContent  = d.org || 'Unknown';
    document.getElementById('ip-dns').textContent      = 'Auto-detected';

    // Latency
    const t0 = performance.now();
    await fetch('https://www.cloudflare.com/cdn-cgi/trace', { mode: 'no-cors', cache: 'no-store' });
    document.getElementById('ip-latency').textContent = `${Math.round(performance.now() - t0)}ms`;

    // VPN / connection type
    const vpnFlags = [];
    if (d.proxy) vpnFlags.push('Proxy detected');
    if (d.hosting) vpnFlags.push('VPN/Hosting');
    const connType = d.mobile ? 'Mobile' : 'Broadband';
    document.getElementById('ip-vpn').textContent = vpnFlags.length
      ? `${vpnFlags.join(', ')} · ${connType}`
      : `Direct · ${connType}`;

  } catch (error) {
    clearTimeout(mainTimeout);
    clearTimeout(ipv4Timeout);
    clearTimeout(ipv6Timeout);
    console.error('IP info error:', error);
    document.getElementById('ip-address').textContent = error.message || 'Error';
    IDS.filter(id => id !== 'ip-address').forEach(id => document.getElementById(id).textContent = '?');
  }
}

function closeIPInfo() {
  document.getElementById('ip-modal').classList.remove('active');
}