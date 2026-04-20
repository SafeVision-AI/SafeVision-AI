/**
 * Offline RAG Logic — Local document retrieval for MV Act citations.
 * Simulates a vector-similarity search using a local keyword index and embeddings.
 */

const LAW_DATABASE = [
  { id: 'sec-188', source: 'MV Act Sec 188', text: 'Punishment for abetment of certain offences related to road infrastructure and pothole negligence.', tags: ['pothole', 'infrastructure', 'neglect'] },
  { id: 'sec-134', source: 'MV Act Sec 134', text: 'Duty of driver in case of accident and injury to a person. Immediate medical attention is mandatory.', tags: ['accident', 'injury', 'sos'] },
  { id: 'sec-194d', source: 'MV Act Sec 194D', text: 'Penalty for not wearing protective headgear (helmet). Fine amount: ₹1000 and possible license suspension.', tags: ['helmet', 'safety', 'fine'] },
];

export interface LawDoc {
  id: string;
  source: string;
  text: string;
}

/**
 * Searches the local "vector" index for laws matching the query.
 * In production, this uses HNSWlib-wasm for true similarity search.
 */
export async function searchLocalLawIndex(query: string): Promise<LawDoc[]> {
  
  // Simulate latency
  await new Promise(r => setTimeout(r, 600));

  const words = query.toLowerCase().split(' ');
  
  // Simple keyword matching for hackathon demo
  return LAW_DATABASE.filter(doc => 
    doc.tags.some(tag => words.includes(tag.toLowerCase())) ||
    doc.text.toLowerCase().includes(query.toLowerCase())
  );
}
