export function getPetEmoji(species) {
  const map = {
    Dog: '🐕',
    Cat: '🐈',
    Bird: '🦜',
    Rabbit: '🐰',
    Hamster: '🐹',
    Fish: '🐟',
    Reptile: '🦎',
    Other: '🐾',
  };
  return map[species] || '🐾';
}

export function getPetGradient(species) {
  const map = {
    Dog: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    Cat: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    Bird: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    Rabbit: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    Hamster: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    Fish: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    Reptile: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
    Other: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  };
  return map[species] || map.Other;
}
