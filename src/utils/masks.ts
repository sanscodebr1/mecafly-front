export const unmask = (v: string) => (v || '').replace(/\D/g, '');

export const maskCPF = (v: string) => {
  let d = unmask(v).slice(0, 11);
  d = d.replace(/(\d{3})(\d)/, '$1.$2');
  d = d.replace(/(\d{3})(\d)/, '$1.$2');
  d = d.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return d;
};

export const maskCNPJ = (v: string) => {
  let d = unmask(v).slice(0, 14);
  d = d.replace(/^(\d{2})(\d)/, '$1.$2');
  d = d.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  d = d.replace(/\.(\d{3})(\d)/, '.$1/$2');
  d = d.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  return d;
};

export const maskCPForCNPJ = (v: string) => {
  const d = unmask(v);
  return d.length <= 11 ? maskCPF(d) : maskCNPJ(d);
};

export const maskPhoneBR = (v: string) => {
  const d = unmask(v).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

// 🔹 RG
export const maskRG = (v: string) => {
  const d = unmask(v).slice(0, 10); // até 10 dígitos
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}-${d.slice(8,10)}`;
};

// 🔹 Data de nascimento (dd/mm/yyyy)
export const maskDate = (v: string) => {
  const d = unmask(v).slice(0, 8); // só 8 dígitos
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
};

export type MaskKind = 'cpf' | 'cnpj' | 'cpfOrCnpj' | 'phone' | 'rg' | 'date';

export const limitRawByMask = (mask: MaskKind, raw: string) => {
  const d = unmask(raw);
  switch (mask) {
    case 'cpf': return d.slice(0, 11);
    case 'cnpj': return d.slice(0, 14);
    case 'cpfOrCnpj': return d.slice(0, 14);
    case 'phone': return d.slice(0, 11);
    case 'rg': return d.slice(0, 10);
    case 'date': return d.slice(0, 8); // ddmmyyyy
    default: return d;
  }
};
