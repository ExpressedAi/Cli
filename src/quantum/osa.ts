/**
 * OSA (Open Scripting Architecture) Integration
 * Mac automation via AppleScript and JXA (JavaScript for Automation)
 */

import { execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// OSA SCRIPT TYPES
// ============================================================================

export type ScriptLanguage = 'applescript' | 'javascript';

export interface OSAScript {
  id: string;
  name: string;
  description: string;
  language: ScriptLanguage;
  source: string;
  category: ScriptCategory;
  permissions: OSAPermission[];
  requiresConfirmation: boolean;
}

export type ScriptCategory =
  | 'system'          // System operations
  | 'finder'          // Finder/file operations
  | 'application'     // Application control
  | 'ui'              // UI automation
  | 'notification'    // Notifications and alerts
  | 'clipboard'       // Clipboard operations
  | 'window'          // Window management
  | 'network'         // Network operations
  | 'utility';        // General utilities

export type OSAPermission =
  | 'accessibility'   // UI scripting
  | 'automation'      // App automation
  | 'contacts'        // Contacts access
  | 'calendar'        // Calendar access
  | 'reminders'       // Reminders access
  | 'photos'          // Photos access
  | 'files'           // File system access
  | 'admin';          // Admin privileges

// ============================================================================
// OSA EXECUTION RESULT
// ============================================================================

export interface OSAResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  script: string;
}

// ============================================================================
// BUILT-IN SCRIPTS LIBRARY
// ============================================================================

export const BUILTIN_SCRIPTS: Record<string, OSAScript> = {
  // ========== SYSTEM OPERATIONS ==========
  getSystemInfo: {
    id: 'system.info',
    name: 'Get System Information',
    description: 'Retrieve macOS system information',
    language: 'applescript',
    source: `
tell application "System Events"
  set systemInfo to "macOS Version: " & (system version of operating system)
  return systemInfo
end tell
    `.trim(),
    category: 'system',
    permissions: [],
    requiresConfirmation: false,
  },

  getBatteryStatus: {
    id: 'system.battery',
    name: 'Get Battery Status',
    description: 'Get current battery level and status',
    language: 'javascript',
    source: `
const app = Application.currentApplication();
app.includeStandardAdditions = true;
const result = app.doShellScript('pmset -g batt');
result;
    `.trim(),
    category: 'system',
    permissions: [],
    requiresConfirmation: false,
  },

  // ========== FINDER OPERATIONS ==========
  getCurrentPath: {
    id: 'finder.currentPath',
    name: 'Get Current Finder Path',
    description: 'Get the current Finder window path',
    language: 'applescript',
    source: `
tell application "Finder"
  if exists Finder window 1 then
    return POSIX path of (target of Finder window 1 as alias)
  else
    return POSIX path of (desktop as alias)
  end if
end tell
    `.trim(),
    category: 'finder',
    permissions: ['automation'],
    requiresConfirmation: false,
  },

  selectFiles: {
    id: 'finder.selectFiles',
    name: 'Select Files in Finder',
    description: 'Select specific files in Finder',
    language: 'applescript',
    source: `
on run {fileList}
  tell application "Finder"
    set selectedFiles to {}
    repeat with filePath in fileList
      set end of selectedFiles to POSIX file filePath as alias
    end repeat
    select selectedFiles
    activate
  end tell
end run
    `.trim(),
    category: 'finder',
    permissions: ['automation', 'files'],
    requiresConfirmation: true,
  },

  revealInFinder: {
    id: 'finder.reveal',
    name: 'Reveal File in Finder',
    description: 'Reveal a file in Finder',
    language: 'javascript',
    source: `
function run(argv) {
  const finder = Application('Finder');
  const filePath = argv[0];
  finder.reveal(Path(filePath));
  finder.activate();
  return 'Revealed: ' + filePath;
}
    `.trim(),
    category: 'finder',
    permissions: ['automation'],
    requiresConfirmation: false,
  },

  // ========== APPLICATION CONTROL ==========
  listRunningApps: {
    id: 'app.list',
    name: 'List Running Applications',
    description: 'Get list of currently running applications',
    language: 'applescript',
    source: `
tell application "System Events"
  set appList to name of every application process whose background only is false
  return appList as text
end tell
    `.trim(),
    category: 'application',
    permissions: [],
    requiresConfirmation: false,
  },

  launchApp: {
    id: 'app.launch',
    name: 'Launch Application',
    description: 'Launch a specific application',
    language: 'applescript',
    source: `
on run {appName}
  tell application appName to launch
  return "Launched: " & appName
end run
    `.trim(),
    category: 'application',
    permissions: ['automation'],
    requiresConfirmation: true,
  },

  quitApp: {
    id: 'app.quit',
    name: 'Quit Application',
    description: 'Quit a specific application',
    language: 'applescript',
    source: `
on run {appName}
  tell application appName to quit
  return "Quit: " & appName
end run
    `.trim(),
    category: 'application',
    permissions: ['automation'],
    requiresConfirmation: true,
  },

  getFrontmostApp: {
    id: 'app.frontmost',
    name: 'Get Frontmost Application',
    description: 'Get the name of the frontmost application',
    language: 'javascript',
    source: `
const systemEvents = Application('System Events');
const frontmost = systemEvents.applicationProcesses.whose({ frontmost: true })[0];
frontmost.name();
    `.trim(),
    category: 'application',
    permissions: [],
    requiresConfirmation: false,
  },

  // ========== UI AUTOMATION ==========
  clickMenuBarItem: {
    id: 'ui.menuBar',
    name: 'Click Menu Bar Item',
    description: 'Click a menu bar item in an application',
    language: 'applescript',
    source: `
on run {appName, menuName, menuItemName}
  tell application "System Events"
    tell process appName
      click menu item menuItemName of menu menuName of menu bar 1
    end tell
  end tell
end run
    `.trim(),
    category: 'ui',
    permissions: ['accessibility', 'automation'],
    requiresConfirmation: true,
  },

  typeText: {
    id: 'ui.type',
    name: 'Type Text',
    description: 'Type text into the frontmost application',
    language: 'applescript',
    source: `
on run {textToType}
  tell application "System Events"
    keystroke textToType
  end tell
end run
    `.trim(),
    category: 'ui',
    permissions: ['accessibility'],
    requiresConfirmation: true,
  },

  // ========== NOTIFICATIONS ==========
  showNotification: {
    id: 'notify.display',
    name: 'Show Notification',
    description: 'Display a system notification',
    language: 'applescript',
    source: `
on run {title, subtitle, message}
  display notification message with title title subtitle subtitle
end run
    `.trim(),
    category: 'notification',
    permissions: [],
    requiresConfirmation: false,
  },

  showDialog: {
    id: 'notify.dialog',
    name: 'Show Dialog',
    description: 'Show a dialog box with buttons',
    language: 'javascript',
    source: `
function run(argv) {
  const app = Application.currentApplication();
  app.includeStandardAdditions = true;

  const title = argv[0] || 'Dialog';
  const message = argv[1] || 'Message';
  const buttons = argv[2] ? argv[2].split(',') : ['OK'];

  const result = app.displayDialog(message, {
    withTitle: title,
    buttons: buttons,
    defaultButton: 1
  });

  return result.buttonReturned;
}
    `.trim(),
    category: 'notification',
    permissions: [],
    requiresConfirmation: false,
  },

  // ========== CLIPBOARD ==========
  getClipboard: {
    id: 'clipboard.get',
    name: 'Get Clipboard Content',
    description: 'Retrieve text from clipboard',
    language: 'applescript',
    source: `
return the clipboard as text
    `.trim(),
    category: 'clipboard',
    permissions: [],
    requiresConfirmation: false,
  },

  setClipboard: {
    id: 'clipboard.set',
    name: 'Set Clipboard Content',
    description: 'Set clipboard to specific text',
    language: 'applescript',
    source: `
on run {textContent}
  set the clipboard to textContent
  return "Clipboard set"
end run
    `.trim(),
    category: 'clipboard',
    permissions: [],
    requiresConfirmation: false,
  },

  // ========== WINDOW MANAGEMENT ==========
  minimizeAllWindows: {
    id: 'window.minimizeAll',
    name: 'Minimize All Windows',
    description: 'Minimize all windows of the frontmost application',
    language: 'applescript',
    source: `
tell application "System Events"
  tell (first application process whose frontmost is true)
    set visible to false
  end tell
end tell
    `.trim(),
    category: 'window',
    permissions: ['accessibility'],
    requiresConfirmation: true,
  },

  arrangeWindows: {
    id: 'window.arrange',
    name: 'Arrange Windows',
    description: 'Tile windows side by side',
    language: 'applescript',
    source: `
tell application "System Events"
  set screenWidth to item 1 of (do shell script "system_profiler SPDisplaysDataType | grep Resolution | awk '{print $2}'")
  set screenHeight to item 2 of (do shell script "system_profiler SPDisplaysDataType | grep Resolution | awk '{print $4}'")

  tell (first application process whose frontmost is true)
    set windowList to every window
    set windowCount to count of windowList

    if windowCount > 0 then
      repeat with i from 1 to windowCount
        set bounds of item i of windowList to {(i - 1) * (screenWidth / windowCount), 0, i * (screenWidth / windowCount), screenHeight}
      end repeat
    end if
  end tell
end tell
    `.trim(),
    category: 'window',
    permissions: ['accessibility'],
    requiresConfirmation: true,
  },

  // ========== UTILITIES ==========
  speakText: {
    id: 'util.speak',
    name: 'Speak Text',
    description: 'Use text-to-speech to speak text',
    language: 'applescript',
    source: `
on run {textToSpeak}
  say textToSpeak
end run
    `.trim(),
    category: 'utility',
    permissions: [],
    requiresConfirmation: false,
  },

  openURL: {
    id: 'util.openURL',
    name: 'Open URL',
    description: 'Open a URL in default browser',
    language: 'javascript',
    source: `
function run(argv) {
  const url = argv[0];
  const app = Application.currentApplication();
  app.includeStandardAdditions = true;
  app.openLocation(url);
  return 'Opened: ' + url;
}
    `.trim(),
    category: 'utility',
    permissions: [],
    requiresConfirmation: false,
  },
};

// ============================================================================
// OSA ENGINE
// ============================================================================

export class OSAEngine {
  private scripts: Map<string, OSAScript> = new Map();
  private executionHistory: OSAResult[] = [];
  private confirmationCallback?: (script: OSAScript, args: string[]) => Promise<boolean>;

  constructor(confirmationCallback?: (script: OSAScript, args: string[]) => Promise<boolean>) {
    // Load built-in scripts
    for (const [key, script] of Object.entries(BUILTIN_SCRIPTS)) {
      this.scripts.set(script.id, script);
    }

    this.confirmationCallback = confirmationCallback;
  }

  // ========================================================================
  // SCRIPT EXECUTION
  // ========================================================================

  async execute(
    scriptIdOrSource: string,
    args: string[] = [],
    language: ScriptLanguage = 'applescript'
  ): Promise<OSAResult> {
    const startTime = Date.now();

    try {
      // Check if it's a built-in script ID
      const script = this.scripts.get(scriptIdOrSource);

      if (script) {
        // Execute built-in script
        return await this.executeScript(script, args);
      } else {
        // Execute custom script source
        const customScript: OSAScript = {
          id: 'custom',
          name: 'Custom Script',
          description: 'Ad-hoc script execution',
          language,
          source: scriptIdOrSource,
          category: 'utility',
          permissions: [],
          requiresConfirmation: false,
        };

        return await this.executeScript(customScript, args);
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const result: OSAResult = {
        success: false,
        output: '',
        error: error.message || String(error),
        executionTime,
        script: scriptIdOrSource,
      };

      this.executionHistory.push(result);
      return result;
    }
  }

  private async executeScript(script: OSAScript, args: string[]): Promise<OSAResult> {
    const startTime = Date.now();

    // Check for confirmation requirement
    if (script.requiresConfirmation && this.confirmationCallback) {
      const confirmed = await this.confirmationCallback(script, args);
      if (!confirmed) {
        return {
          success: false,
          output: '',
          error: 'User denied confirmation',
          executionTime: Date.now() - startTime,
          script: script.id,
        };
      }
    }

    try {
      const output = await this.runOSAScript(script.language, script.source, args);

      const result: OSAResult = {
        success: true,
        output: output.trim(),
        executionTime: Date.now() - startTime,
        script: script.id,
      };

      this.executionHistory.push(result);
      return result;
    } catch (error: any) {
      const result: OSAResult = {
        success: false,
        output: '',
        error: error.message || String(error),
        executionTime: Date.now() - startTime,
        script: script.id,
      };

      this.executionHistory.push(result);
      return result;
    }
  }

  private async runOSAScript(
    language: ScriptLanguage,
    source: string,
    args: string[]
  ): Promise<string> {
    const languageFlag = language === 'applescript' ? 'AppleScript' : 'JavaScript';

    // Build osascript command
    let command = `osascript -l ${languageFlag}`;

    // Add arguments if provided
    const argsString = args.map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(' ');

    // Execute with heredoc for multi-line scripts
    const fullCommand = `${command} <<'EOF'\n${source}\nEOF\n${argsString}`;

    try {
      const { stdout, stderr } = await execAsync(fullCommand);
      if (stderr) {
        throw new Error(stderr);
      }
      return stdout;
    } catch (error: any) {
      throw new Error(`OSA execution failed: ${error.message}`);
    }
  }

  // ========================================================================
  // SYNCHRONOUS EXECUTION
  // ========================================================================

  executeSync(
    scriptIdOrSource: string,
    args: string[] = [],
    language: ScriptLanguage = 'applescript'
  ): OSAResult {
    const startTime = Date.now();

    try {
      const script = this.scripts.get(scriptIdOrSource);

      if (script) {
        return this.executeScriptSync(script, args);
      } else {
        const customScript: OSAScript = {
          id: 'custom',
          name: 'Custom Script',
          description: 'Ad-hoc script execution',
          language,
          source: scriptIdOrSource,
          category: 'utility',
          permissions: [],
          requiresConfirmation: false,
        };

        return this.executeScriptSync(customScript, args);
      }
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message || String(error),
        executionTime: Date.now() - startTime,
        script: scriptIdOrSource,
      };
    }
  }

  private executeScriptSync(script: OSAScript, args: string[]): OSAResult {
    const startTime = Date.now();

    try {
      const languageFlag = script.language === 'applescript' ? 'AppleScript' : 'JavaScript';
      const argsString = args.map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(' ');
      const command = `osascript -l ${languageFlag} <<'EOF'\n${script.source}\nEOF\n${argsString}`;

      const output = execSync(command, { encoding: 'utf-8' });

      const result: OSAResult = {
        success: true,
        output: output.trim(),
        executionTime: Date.now() - startTime,
        script: script.id,
      };

      this.executionHistory.push(result);
      return result;
    } catch (error: any) {
      const result: OSAResult = {
        success: false,
        output: '',
        error: error.stderr?.toString() || error.message || String(error),
        executionTime: Date.now() - startTime,
        script: script.id,
      };

      this.executionHistory.push(result);
      return result;
    }
  }

  // ========================================================================
  // SCRIPT MANAGEMENT
  // ========================================================================

  addScript(script: OSAScript): void {
    this.scripts.set(script.id, script);
  }

  getScript(id: string): OSAScript | undefined {
    return this.scripts.get(id);
  }

  listScripts(category?: ScriptCategory): OSAScript[] {
    const allScripts = Array.from(this.scripts.values());

    if (category) {
      return allScripts.filter(s => s.category === category);
    }

    return allScripts;
  }

  removeScript(id: string): boolean {
    return this.scripts.delete(id);
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  checkPermissions(script: OSAScript): PermissionCheckResult {
    const missing: OSAPermission[] = [];
    const warnings: string[] = [];

    // Check if running on macOS
    if (process.platform !== 'darwin') {
      return {
        canExecute: false,
        missing: [],
        warnings: ['OSA scripts can only run on macOS'],
      };
    }

    // Check for required permissions
    for (const permission of script.permissions) {
      if (permission === 'accessibility') {
        warnings.push('Accessibility permission may be required');
      }
      if (permission === 'automation') {
        warnings.push('Automation permission may be required');
      }
      if (permission === 'admin') {
        warnings.push('Administrator privileges may be required');
      }
    }

    return {
      canExecute: true,
      missing,
      warnings,
    };
  }

  getExecutionHistory(limit?: number): OSAResult[] {
    if (limit) {
      return this.executionHistory.slice(-limit);
    }
    return [...this.executionHistory];
  }

  clearHistory(): void {
    this.executionHistory = [];
  }

  getStats(): OSAStats {
    const total = this.executionHistory.length;
    const successful = this.executionHistory.filter(r => r.success).length;
    const failed = total - successful;

    const avgExecutionTime = total > 0
      ? this.executionHistory.reduce((sum, r) => sum + r.executionTime, 0) / total
      : 0;

    return {
      totalExecutions: total,
      successful,
      failed,
      successRate: total > 0 ? successful / total : 0,
      avgExecutionTime,
      totalScripts: this.scripts.size,
    };
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface PermissionCheckResult {
  canExecute: boolean;
  missing: OSAPermission[];
  warnings: string[];
}

export interface OSAStats {
  totalExecutions: number;
  successful: number;
  failed: number;
  successRate: number;
  avgExecutionTime: number;
  totalScripts: number;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export function createOSAEngine(
  confirmationCallback?: (script: OSAScript, args: string[]) => Promise<boolean>
): OSAEngine {
  return new OSAEngine(confirmationCallback);
}

export function quickExecute(
  scriptId: string,
  ...args: string[]
): OSAResult {
  const engine = new OSAEngine();
  return engine.executeSync(scriptId, args);
}
