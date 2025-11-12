/**
 * Terminal UI utilities for beautiful CLI output
 */

import { ProgressUpdate } from "../types/index.js";

// Color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

export class UI {
  private static spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private static spinnerIndex = 0;

  static success(message: string): void {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
  }

  static error(message: string): void {
    console.error(`${colors.red}✗${colors.reset} ${message}`);
  }

  static warning(message: string): void {
    console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
  }

  static info(message: string): void {
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
  }

  static header(message: string): void {
    console.log(`\n${colors.bright}${colors.cyan}${"=".repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${message}${colors.reset}`);
    console.log(`${colors.cyan}${"=".repeat(60)}${colors.reset}\n`);
  }

  static section(message: string): void {
    console.log(`\n${colors.bright}${message}${colors.reset}`);
    console.log(`${colors.gray}${"-".repeat(message.length)}${colors.reset}`);
  }

  static progress(update: ProgressUpdate): void {
    const percent = Math.round((update.current / update.total) * 100);
    const barLength = 30;
    const filled = Math.round((percent / 100) * barLength);
    const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
    const message = update.message ? ` ${update.message}` : "";
    process.stdout.write(
      `\r${colors.cyan}${bar}${colors.reset} ${percent}%${message}${" ".repeat(20)}`
    );
    if (update.current === update.total) {
      console.log();
    }
  }

  static spin(message: string): () => void {
    let intervalId: NodeJS.Timeout;
    const start = () => {
      intervalId = setInterval(() => {
        const frame = this.spinner[this.spinnerIndex];
        this.spinnerIndex = (this.spinnerIndex + 1) % this.spinner.length;
        process.stdout.write(`\r${colors.cyan}${frame}${colors.reset} ${message}`);
      }, 80);
    };

    start();

    return () => {
      clearInterval(intervalId);
      process.stdout.write(`\r${" ".repeat(message.length + 3)}\r`);
    };
  }

  static table(data: Record<string, string | number>[]): void {
    if (data.length === 0) return;

    const keys = Object.keys(data[0]!);
    const colWidths = keys.map((key) =>
      Math.max(
        key.length,
        ...data.map((row) => String(row[key] ?? "").length)
      )
    );

    // Header
    console.log(
      keys
        .map((key, i) => key.padEnd(colWidths[i]!))
        .join(" │ ")
    );
    console.log(colWidths.map((w) => "─".repeat(w)).join("─┼─"));

    // Rows
    data.forEach((row) => {
      console.log(
        keys
          .map((key, i) => String(row[key] ?? "").padEnd(colWidths[i]!))
          .join(" │ ")
      );
    });
  }

  static code(code: string, language?: string): void {
    const lang = language ? ` (${language})` : "";
    console.log(`${colors.gray}╭─ Code${lang}${colors.reset}`);
    code.split("\n").forEach((line) => {
      console.log(`${colors.gray}│${colors.reset} ${line}`);
    });
    console.log(`${colors.gray}╰${"─".repeat(50)}${colors.reset}`);
  }

  static json(obj: any): void {
    console.log(
      JSON.stringify(obj, null, 2)
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n")
    );
  }

  static divider(): void {
    console.log(`${colors.gray}${"─".repeat(60)}${colors.reset}`);
  }

  static clear(): void {
    process.stdout.write("\x1Bc");
  }

  static bold(text: string): string {
    return `${colors.bright}${text}${colors.reset}`;
  }

  static dim(text: string): string {
    return `${colors.dim}${text}${colors.reset}`;
  }

  static color(text: string, color: keyof typeof colors): string {
    return `${colors[color]}${text}${colors.reset}`;
  }

  // Quantum visualizations
  static quantumBanner(): void {
    const banner = `
${colors.magenta}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  ${colors.bright}${colors.cyan}⚛️  QUANTUM COGNITIVE OS${colors.reset}${colors.magenta}  ${colors.dim}v1.0.0${colors.reset}${colors.magenta}                      ║
║  ${colors.dim}100D Memory • Phase-Locking • Neuron Network${colors.reset}${colors.magenta}            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
`;
    console.log(banner);
  }

  static quantumMode(modeName: string, emoji: string, description: string): void {
    console.log();
    console.log(`${emoji}  ${colors.bright}${colors.cyan}${modeName}${colors.reset}`);
    console.log(`${colors.dim}${description}${colors.reset}`);
    this.divider();
  }

  static bar(value: number, maxValue: number = 1, width: number = 30): string {
    const filled = Math.round((value / maxValue) * width);
    const empty = width - filled;
    const fillChar = '█';
    const emptyChar = '░';

    let color: keyof typeof colors = 'green';
    if (value / maxValue < 0.5) color = 'red';
    else if (value / maxValue < 0.75) color = 'yellow';

    return `${colors[color]}${fillChar.repeat(filled)}${colors.gray}${emptyChar.repeat(empty)}${colors.reset}`;
  }

  static sparkline(values: number[]): string {
    if (values.length === 0) return '';

    const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    return values
      .map(v => {
        const normalized = (v - min) / range;
        const index = Math.min(Math.floor(normalized * chars.length), chars.length - 1);
        return chars[index];
      })
      .join('');
  }

  static neuronActivation(neurons: string[]): void {
    console.log(`\n${colors.bright}🧠 Neurons Activated:${colors.reset}`);
    neurons.forEach(neuron => {
      console.log(`  ${colors.cyan}•${colors.reset} ${neuron}`);
    });
  }

  static dimensionCloud(dimensions: Record<string, number>): void {
    console.log(`\n${colors.bright}📊 Dimension Activation Cloud:${colors.reset}\n`);

    const sorted = Object.entries(dimensions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const maxValue = sorted[0]?.[1] || 1;

    sorted.forEach(([dim, value]) => {
      const bar = this.bar(value, maxValue, 20);
      const percentage = (value * 100).toFixed(0);
      console.log(`  ${dim.padEnd(20)} ${bar} ${colors.dim}${percentage}%${colors.reset}`);
    });
  }

  static wormholePath(path: string[]): void {
    console.log(`\n${colors.bright}🌀 Wormhole Path:${colors.reset}\n`);

    for (let i = 0; i < path.length; i++) {
      const isLast = i === path.length - 1;
      const connector = isLast ? '' : `  ${colors.magenta}↓${colors.reset}\n`;
      console.log(`  ${colors.cyan}${i + 1}.${colors.reset} ${path[i]}`);
      if (!isLast) console.log(connector);
    }
  }
}
