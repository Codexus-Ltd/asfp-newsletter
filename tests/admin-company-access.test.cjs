const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const companies = [
  { id: 'codexus-id', slug: 'codexus', name: 'Codexus', active: true },
  { id: 'other-id', slug: 'other', name: 'Other', active: true },
  { id: 'inactive-id', slug: 'inactive', name: 'Inactive', active: false },
];

async function render(page, platformAdmin, memberships, signedIn = true) {
  const database = {
    auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'ben' } : null } }) },
    from(table) {
      let rows = table === 'profiles' ? [{ platform_admin: platformAdmin }]
        : table === 'company_users' ? memberships.map(company_id => ({ user_id: 'ben', company_id }))
        : table === 'companies' ? companies : [];
      const query = {
        select() { return query; },
        eq(key, value) { if (table !== 'profiles') rows = rows.filter(row => row[key] === value); return query; },
        in(key, values) { rows = rows.filter(row => values.includes(row[key])); return query; },
        order() { return query; }, limit() { return query; },
        single: async () => ({ data: rows[0] }),
        maybeSingle: async () => ({ data: rows[0] ?? null }),
        then(resolve, reject) { return Promise.resolve({ data: rows, count: rows.length }).then(resolve, reject); },
      };
      return query;
    },
  };
  const source = fs.readFileSync(`app/admin/${page}/page.tsx`, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const exports = {};
  const sidebar = function Sidebar() {};
  vm.runInNewContext(code, { exports, process, require(name) {
    if (name === '@/lib/supabase-server') return { createSupabaseServerClient: async () => database };
    if (name === 'next/navigation') return { redirect: () => { throw Error('redirect:/login'); } };
    if (name === '@/components/AdminSidebar') return { default: sidebar };
    if (name.startsWith('@/components/')) return { default: () => null };
    return require(name);
  }});
  const result = await exports.default({ searchParams: Promise.resolve({ company: 'codexus' }) });
  const children = result.props.children;
  return Array.isArray(children) ? children.find(child => child?.type === sidebar)?.props : undefined;
}

for (const page of ['subscribers', 'issues', 'polls', 'email']) {
  test(`${page}: platform admin with no memberships can select active Codexus`, async () => {
    const props = await render(page, true, []);
    assert.equal(props.currentCompany.slug, 'codexus');
    assert.deepEqual(Array.from(props.companies, c => c.slug), ['codexus', 'other']);
  });
  test(`${page}: ordinary user remains restricted to their memberships`, async () => {
    const props = await render(page, false, ['other-id']);
    assert.equal(props.currentCompany.slug, 'other');
    assert.deepEqual(Array.from(props.companies, c => c.slug), ['other']);
  });
  test(`${page}: ordinary user without memberships has no access`, async () => {
    assert.equal(await render(page, false, []), undefined);
  });
  test(`${page}: signed-out visitor must log in`, async () => {
    await assert.rejects(render(page, true, [], false), /redirect:\/login/);
  });
}
