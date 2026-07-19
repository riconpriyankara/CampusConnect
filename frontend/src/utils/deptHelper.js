/**
 * Convert department names to standard Indian campus acronyms (CSE, EEE, ECE, IT, MECH, CIVIL, etc.)
 */
export const getDeptCode = (department) => {
  if (!department) return 'GEN';
  const dept = String(department).toLowerCase().trim();
  if (dept.includes('computer') || dept.includes('cs')) return 'CSE';
  if (dept.includes('electrical') || dept.includes('eee')) return 'EEE';
  if (dept.includes('electronics') || dept.includes('ece')) return 'ECE';
  if (dept.includes('information') || dept.includes('it')) return 'IT';
  if (dept.includes('mechanical') || dept.includes('mech')) return 'MECH';
  if (dept.includes('civil')) return 'CIVIL';
  if (dept.includes('chemical')) return 'CHEM';
  if (dept.includes('bio')) return 'BIOTECH';
  if (dept.includes('business') || dept.includes('administration') || dept.includes('mba')) return 'MBA';
  return department.substring(0, 4).toUpperCase();
};
