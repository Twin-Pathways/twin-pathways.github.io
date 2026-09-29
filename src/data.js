// Demo edges for the hero animation: not output of a real run, just summaries of well-known relationships.
// result: 'ab' = A → B, 'ba' = B → A, 'both' = bidirectional. vote: same values, or 'none'.
export const demoEdges = [
  {
    a: 'TP53', b: 'CDKN1A', result: 'ab',
    evidence: [
      { source: 'Europe PMC', text: 'p53 binds the CDKN1A (p21) promoter and activates its transcription.', vote: 'ab' },
      { source: 'NCBI Entrez', text: 'After DNA damage, p53 accumulates and p21 expression rises.', vote: 'ab' },
      { source: 'STRING', text: 'A high-confidence association, but it carries no direction.', vote: 'none' },
    ],
  },
  {
    a: 'TP53', b: 'MDM2', result: 'both',
    evidence: [
      { source: 'Europe PMC', text: 'p53 increases transcription of the MDM2 gene.', vote: 'ab' },
      { source: 'NCBI Entrez', text: 'MDM2 ubiquitinates p53 and targets it for degradation.', vote: 'ba' },
      { source: 'STRING', text: 'A high-confidence association, but it carries no direction.', vote: 'none' },
    ],
  },
  {
    a: 'TP53', b: 'ATM', result: 'ba',
    evidence: [
      { source: 'Europe PMC', text: 'ATM phosphorylates p53 in response to DNA damage.', vote: 'ba' },
      { source: 'NCBI Entrez', text: 'Without ATM, the p53 response is weakened.', vote: 'ba' },
      { source: 'STRING', text: 'A high-confidence association, but it carries no direction.', vote: 'none' },
    ],
  },
];

// Illustrative regulatory neighbourhood around TP53 for the About-section 3D network.
// kind: 'activates' or 'represses'. Well-known interactions, not output of a real run.
export const networkNodes = ['TP53', 'MDM2', 'ATM', 'CHEK2', 'CDKN1A', 'CDK2', 'BAX', 'BBC3', 'GADD45A'];

export const networkEdges = [
  { from: 'ATM', to: 'CHEK2', kind: 'activates' },
  { from: 'ATM', to: 'TP53', kind: 'activates' },
  { from: 'CHEK2', to: 'TP53', kind: 'activates' },
  { from: 'MDM2', to: 'TP53', kind: 'represses' },
  { from: 'TP53', to: 'MDM2', kind: 'activates' },
  { from: 'TP53', to: 'CDKN1A', kind: 'activates' },
  { from: 'TP53', to: 'BAX', kind: 'activates' },
  { from: 'TP53', to: 'BBC3', kind: 'activates' },
  { from: 'TP53', to: 'GADD45A', kind: 'activates' },
  { from: 'CDKN1A', to: 'CDK2', kind: 'represses' },
];
