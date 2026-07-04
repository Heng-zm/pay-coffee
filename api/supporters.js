const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

const safeJson = (res, status, data) => {
  res.status(status).setHeader('Content-Type', jsonHeaders['Content-Type']);
  res.setHeader('Cache-Control', jsonHeaders['Cache-Control']);
  res.end(JSON.stringify(data));
};

const sanitizeTableName = (value) => {
  const table = String(value || 'supporters').trim();
  return /^[a-zA-Z0-9_]+$/.test(table) ? table : 'supporters';
};

const normalizeSupporter = (item, index) => {
  const amount = Number(item.amount ?? item.total ?? item.value ?? 0);
  const name = String(item.name || item.full_name || item.display_name || item.username || '').trim();

  if (!name || !Number.isFinite(amount)) return null;

  return {
    id: item.id || `${name}-${amount}-${index}`,
    name,
    amount,
    created_at: item.created_at || item.createdAt || item.date || null,
  };
};

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    safeJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  const table = sanitizeTableName(process.env.SUPABASE_SUPPORTERS_TABLE);

  if (!supabaseUrl || !supabaseKey) {
    safeJson(res, 200, { ok: true, supporters: [], source: 'empty' });
    return;
  }

  try {
    const url = `${supabaseUrl}/rest/v1/${table}?select=id,name,amount,created_at&order=amount.desc&limit=100`;
    const response = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Supabase returned ${response.status}: ${body}`);
    }

    const rows = await response.json();
    const supporters = Array.isArray(rows)
      ? rows.map(normalizeSupporter).filter(Boolean)
      : [];

    safeJson(res, 200, { ok: true, supporters, source: 'supabase' });
  } catch (error) {
    console.error('supporters API error:', error);
    safeJson(res, 500, {
      ok: false,
      supporters: [],
      error: error?.message || 'Failed to fetch supporters.',
    });
  }
};
