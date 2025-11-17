// Versão de demonstração com dados pré-definidos

interface SimulationResult {
    algorithm: string;
    finalPages: (number | null)[];
    pageFaults: number;
    steps: string[];
}

class LRU {
    private frames: (number | null)[];
    private capacity: number;
    private pageFaults: number;
    private steps: string[];

    constructor(capacity: number) {
        this.capacity = capacity;
        this.frames = new Array(capacity).fill(null);
        this.pageFaults = 0;
        this.steps = [];
    }

    simulate(references: number[]): SimulationResult {
        console.log('\n=== Simulação LRU (Least Recently Used) ===\n');
        
        const recentlyUsed: number[] = [];

        for (let i = 0; i < references.length; i++) {
            const page = references[i];
            const frameIndex = this.frames.indexOf(page);

            if (frameIndex !== -1) {
                const pos = recentlyUsed.indexOf(page);
                recentlyUsed.splice(pos, 1);
                recentlyUsed.push(page);
                
                this.steps.push(`Passo ${i + 1}: Página ${page} - HIT | Frames: [${this.frames.join(', ')}]`);
            } else {
                this.pageFaults++;

                if (this.frames.includes(null)) {
                    const emptyIndex = this.frames.indexOf(null);
                    this.frames[emptyIndex] = page;
                    recentlyUsed.push(page);
                    
                    this.steps.push(`Passo ${i + 1}: Página ${page} - FAULT (inserida) | Frames: [${this.frames.join(', ')}]`);
                } else {
                    const lruPage = recentlyUsed.shift()!;
                    const replaceIndex = this.frames.indexOf(lruPage);
                    this.frames[replaceIndex] = page;
                    recentlyUsed.push(page);
                    
                    this.steps.push(`Passo ${i + 1}: Página ${page} - FAULT (substituiu ${lruPage}) | Frames: [${this.frames.join(', ')}]`);
                }
            }

            console.log(this.steps[this.steps.length - 1]);
        }

        return {
            algorithm: 'LRU',
            finalPages: [...this.frames],
            pageFaults: this.pageFaults,
            steps: this.steps
        };
    }
}

class LFU {
    private frames: (number | null)[];
    private capacity: number;
    private pageFaults: number;
    private frequency: Map<number, number>;
    private steps: string[];

    constructor(capacity: number) {
        this.capacity = capacity;
        this.frames = new Array(capacity).fill(null);
        this.pageFaults = 0;
        this.frequency = new Map();
        this.steps = [];
    }

    simulate(references: number[]): SimulationResult {
        console.log('\n=== Simulação LFU (Least Frequently Used) ===\n');

        for (let i = 0; i < references.length; i++) {
            const page = references[i];
            const frameIndex = this.frames.indexOf(page);

            if (frameIndex !== -1) {
                this.frequency.set(page, (this.frequency.get(page) || 0) + 1);
                
                this.steps.push(`Passo ${i + 1}: Página ${page} - HIT (freq: ${this.frequency.get(page)}) | Frames: [${this.frames.join(', ')}]`);
            } else {
                this.pageFaults++;
                this.frequency.set(page, 1);

                if (this.frames.includes(null)) {
                    const emptyIndex = this.frames.indexOf(null);
                    this.frames[emptyIndex] = page;
                    
                    this.steps.push(`Passo ${i + 1}: Página ${page} - FAULT (inserida) | Frames: [${this.frames.join(', ')}]`);
                } else {
                    let minFreq = Infinity;
                    let lfuPage = -1;
                    let lfuIndex = -1;

                    for (let j = 0; j < this.frames.length; j++) {
                        const framePage = this.frames[j]!;
                        const freq = this.frequency.get(framePage) || 0;
                        
                        if (freq < minFreq) {
                            minFreq = freq;
                            lfuPage = framePage;
                            lfuIndex = j;
                        }
                    }

                    this.frequency.delete(lfuPage);
                    this.frames[lfuIndex] = page;
                    
                    this.steps.push(`Passo ${i + 1}: Página ${page} - FAULT (substituiu ${lfuPage} freq:${minFreq}) | Frames: [${this.frames.join(', ')}]`);
                }
            }

            console.log(this.steps[this.steps.length - 1]);
        }

        return {
            algorithm: 'LFU',
            finalPages: [...this.frames],
            pageFaults: this.pageFaults,
            steps: this.steps
        };
    }
}

// DEMONSTRAÇÃO COM DADOS PRÉ-DEFINIDOS
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   SIMULADOR DE ALGORITMOS DE SUBSTITUIÇÃO DE PÁGINAS   ║');
console.log('║              LRU (Least Recently Used)                 ║');
console.log('║            LFU (Least Frequently Used)                 ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// EXEMPLO 1
const references1 = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2];
const capacity1 = 4;

console.log(`Sequência de referência: [${references1.join(', ')}]`);
console.log(`Quantidade de frames: ${capacity1}`);

console.log('\n' + '='.repeat(60));

const lru1 = new LRU(capacity1);
const lruResult1 = lru1.simulate(references1);

console.log('\n' + '='.repeat(60));

const lfu1 = new LFU(capacity1);
const lfuResult1 = lfu1.simulate(references1);

console.log('\n' + '╔' + '═'.repeat(58) + '╗');
console.log('║' + ' '.repeat(20) + 'RESULTADOS FINAIS' + ' '.repeat(21) + '║');
console.log('╚' + '═'.repeat(58) + '╝\n');

console.log('┌─ LRU (Least Recently Used) ─────────────────────────┐');
console.log(`│ Conteúdo final da memória: [${lruResult1.finalPages.join(', ')}]`);
console.log(`│ Total de Page Faults: ${lruResult1.pageFaults}`);
console.log(`│ Taxa de Hit: ${((references1.length - lruResult1.pageFaults) / references1.length * 100).toFixed(2)}%`);
console.log('└──────────────────────────────────────────────────────┘\n');

console.log('┌─ LFU (Least Frequently Used) ───────────────────────┐');
console.log(`│ Conteúdo final da memória: [${lfuResult1.finalPages.join(', ')}]`);
console.log(`│ Total de Page Faults: ${lfuResult1.pageFaults}`);
console.log(`│ Taxa de Hit: ${((references1.length - lfuResult1.pageFaults) / references1.length * 100).toFixed(2)}%`);
console.log('└──────────────────────────────────────────────────────┘\n');

console.log('┌─ COMPARAÇÃO ─────────────────────────────────────────┐');
if (lruResult1.pageFaults < lfuResult1.pageFaults) {
    console.log(`│ ✓ LRU teve melhor desempenho`);
    console.log(`│   (${lruResult1.pageFaults} faults vs ${lfuResult1.pageFaults} faults)`);
} else if (lfuResult1.pageFaults < lruResult1.pageFaults) {
    console.log(`│ ✓ LFU teve melhor desempenho`);
    console.log(`│   (${lfuResult1.pageFaults} faults vs ${lruResult1.pageFaults} faults)`);
} else {
    console.log(`│ ≈ Ambos tiveram o mesmo desempenho`);
    console.log(`│   (${lruResult1.pageFaults} faults cada)`);
}
console.log('└──────────────────────────────────────────────────────┘\n');

// EXEMPLO 2
console.log('\n' + '█'.repeat(60));
console.log('█' + ' '.repeat(22) + 'EXEMPLO 2' + ' '.repeat(27) + '█');
console.log('█'.repeat(60) + '\n');

const references2 = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
const capacity2 = 3;

console.log(`Sequência de referência: [${references2.join(', ')}]`);
console.log(`Quantidade de frames: ${capacity2}`);

console.log('\n' + '='.repeat(60));

const lru2 = new LRU(capacity2);
const lruResult2 = lru2.simulate(references2);

console.log('\n' + '='.repeat(60));

const lfu2 = new LFU(capacity2);
const lfuResult2 = lfu2.simulate(references2);

console.log('\n' + '╔' + '═'.repeat(58) + '╗');
console.log('║' + ' '.repeat(20) + 'RESULTADOS FINAIS' + ' '.repeat(21) + '║');
console.log('╚' + '═'.repeat(58) + '╝\n');

console.log('┌─ LRU (Least Recently Used) ─────────────────────────┐');
console.log(`│ Conteúdo final da memória: [${lruResult2.finalPages.join(', ')}]`);
console.log(`│ Total de Page Faults: ${lruResult2.pageFaults}`);
console.log(`│ Taxa de Hit: ${((references2.length - lruResult2.pageFaults) / references2.length * 100).toFixed(2)}%`);
console.log('└──────────────────────────────────────────────────────┘\n');

console.log('┌─ LFU (Least Frequently Used) ───────────────────────┐');
console.log(`│ Conteúdo final da memória: [${lfuResult2.finalPages.join(', ')}]`);
console.log(`│ Total de Page Faults: ${lfuResult2.pageFaults}`);
console.log(`│ Taxa de Hit: ${((references2.length - lfuResult2.pageFaults) / references2.length * 100).toFixed(2)}%`);
console.log('└──────────────────────────────────────────────────────┘\n');

console.log('┌─ COMPARAÇÃO ─────────────────────────────────────────┐');
if (lruResult2.pageFaults < lfuResult2.pageFaults) {
    console.log(`│ ✓ LRU teve melhor desempenho`);
    console.log(`│   (${lruResult2.pageFaults} faults vs ${lfuResult2.pageFaults} faults)`);
} else if (lfuResult2.pageFaults < lruResult2.pageFaults) {
    console.log(`│ ✓ LFU teve melhor desempenho`);
    console.log(`│   (${lfuResult2.pageFaults} faults vs ${lruResult2.pageFaults} faults)`);
} else {
    console.log(`│ ≈ Ambos tiveram o mesmo desempenho`);
    console.log(`│   (${lruResult2.pageFaults} faults cada)`);
}
console.log('└──────────────────────────────────────────────────────┘\n');
