import * as readline from 'readline';

// Interface para resultado da simulação
interface SimulationResult {
    algorithm: string;
    finalPages: (number | null)[];
    pageFaults: number;
    steps: string[];
}

// Classe para implementar LRU (Least Recently Used)
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
        
        const recentlyUsed: number[] = []; // Mantém ordem de uso recente

        for (let i = 0; i < references.length; i++) {
            const page = references[i];
            const frameIndex = this.frames.indexOf(page);

            if (frameIndex !== -1) {
                // Page HIT - página já está na memória
                // Atualiza posição na lista de recentemente usado
                const pos = recentlyUsed.indexOf(page);
                recentlyUsed.splice(pos, 1);
                recentlyUsed.push(page);
                
                this.steps.push(`Passo ${i + 1}: Página ${page} - HIT | Frames: [${this.frames.join(', ')}]`);
            } else {
                // Page FAULT - página não está na memória
                this.pageFaults++;

                if (this.frames.includes(null)) {
                    // Há espaço vazio
                    const emptyIndex = this.frames.indexOf(null);
                    this.frames[emptyIndex] = page;
                    recentlyUsed.push(page);
                    
                    this.steps.push(`Passo ${i + 1}: Página ${page} - FAULT (inserida) | Frames: [${this.frames.join(', ')}]`);
                } else {
                    // Substituir página menos recentemente usada
                    const lruPage = recentlyUsed.shift()!; // Remove o menos recente
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

// Classe para implementar LFU (Least Frequently Used)
class LFU {
    private frames: (number | null)[];
    private capacity: number;
    private pageFaults: number;
    private frequency: Map<number, number>; // Contador de frequência
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
                // Page HIT - página já está na memória
                this.frequency.set(page, (this.frequency.get(page) || 0) + 1);
                
                this.steps.push(`Passo ${i + 1}: Página ${page} - HIT (freq: ${this.frequency.get(page)}) | Frames: [${this.frames.join(', ')}]`);
            } else {
                // Page FAULT - página não está na memória
                this.pageFaults++;
                this.frequency.set(page, 1);

                if (this.frames.includes(null)) {
                    // Há espaço vazio
                    const emptyIndex = this.frames.indexOf(null);
                    this.frames[emptyIndex] = page;
                    
                    this.steps.push(`Passo ${i + 1}: Página ${page} - FAULT (inserida) | Frames: [${this.frames.join(', ')}]`);
                } else {
                    // Substituir página menos frequentemente usada
                    let minFreq = Infinity;
                    let lfuPage = -1;
                    let lfuIndex = -1;

                    // Encontra a página com menor frequência
                    for (let j = 0; j < this.frames.length; j++) {
                        const framePage = this.frames[j]!;
                        const freq = this.frequency.get(framePage) || 0;
                        
                        if (freq < minFreq) {
                            minFreq = freq;
                            lfuPage = framePage;
                            lfuIndex = j;
                        }
                    }

                    // Remove a frequência da página substituída
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

// Função principal
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(prompt, (answer) => {
                resolve(answer);
            });
        });
    };

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   SIMULADOR DE ALGORITMOS DE SUBSTITUIÇÃO DE PÁGINAS   ║');
    console.log('║              LRU (Least Recently Used)                 ║');
    console.log('║            LFU (Least Frequently Used)                 ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    try {
        // 1. Entrada da sequência de referência
        const refInput = await question('Digite a sequência de referência de páginas (separadas por espaço):\nEx: 1 2 3 4 1 2 5 1 2 3 4 5\n> ');
        const references = refInput.trim().split(/\s+/).map(num => parseInt(num));

        if (references.some(isNaN)) {
            console.log('\n❌ Erro: A sequência deve conter apenas números!');
            rl.close();
            return;
        }

        console.log(`\n✓ Sequência de referência: [${references.join(', ')}]`);

        // 2. Entrada da quantidade de frames
        const capacityInput = await question('\nDigite a quantidade de páginas de memória (frames):\n> ');
        const capacity = parseInt(capacityInput);

        if (isNaN(capacity) || capacity <= 0) {
            console.log('\n❌ Erro: A quantidade de frames deve ser um número positivo!');
            rl.close();
            return;
        }

        console.log(`✓ Quantidade de frames: ${capacity}`);

        // Executar simulações
        console.log('\n' + '='.repeat(60));
        
        // LRU
        const lru = new LRU(capacity);
        const lruResult = lru.simulate(references);

        console.log('\n' + '='.repeat(60));
        
        // LFU
        const lfu = new LFU(capacity);
        const lfuResult = lfu.simulate(references);

        // Exibir resultados finais
        console.log('\n' + '╔' + '═'.repeat(58) + '╗');
        console.log('║' + ' '.repeat(20) + 'RESULTADOS FINAIS' + ' '.repeat(21) + '║');
        console.log('╚' + '═'.repeat(58) + '╝\n');

        console.log('┌─ LRU (Least Recently Used) ─────────────────────────┐');
        console.log(`│ Conteúdo final da memória: [${lruResult.finalPages.join(', ')}]`);
        console.log(`│ Total de Page Faults: ${lruResult.pageFaults}`);
        console.log(`│ Taxa de Hit: ${((references.length - lruResult.pageFaults) / references.length * 100).toFixed(2)}%`);
        console.log('└──────────────────────────────────────────────────────┘\n');

        console.log('┌─ LFU (Least Frequently Used) ───────────────────────┐');
        console.log(`│ Conteúdo final da memória: [${lfuResult.finalPages.join(', ')}]`);
        console.log(`│ Total de Page Faults: ${lfuResult.pageFaults}`);
        console.log(`│ Taxa de Hit: ${((references.length - lfuResult.pageFaults) / references.length * 100).toFixed(2)}%`);
        console.log('└──────────────────────────────────────────────────────┘\n');

        // Comparação
        console.log('┌─ COMPARAÇÃO ─────────────────────────────────────────┐');
        if (lruResult.pageFaults < lfuResult.pageFaults) {
            console.log(`│ ✓ LRU teve melhor desempenho`);
            console.log(`│   (${lruResult.pageFaults} faults vs ${lfuResult.pageFaults} faults)`);
        } else if (lfuResult.pageFaults < lruResult.pageFaults) {
            console.log(`│ ✓ LFU teve melhor desempenho`);
            console.log(`│   (${lfuResult.pageFaults} faults vs ${lruResult.pageFaults} faults)`);
        } else {
            console.log(`│ ≈ Ambos tiveram o mesmo desempenho`);
            console.log(`│   (${lruResult.pageFaults} faults cada)`);
        }
        console.log('└──────────────────────────────────────────────────────┘\n');

    } catch (error) {
        console.error('\n❌ Erro durante a execução:', error);
    } finally {
        rl.close();
    }
}

// Executar aplicação
main();
