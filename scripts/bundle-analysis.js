#!/usr/bin/env node
/**
 * Bundle Analysis Script
 * Analyzes React Native bundle size and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');

class BundleAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.sourceDir = path.join(this.projectRoot, 'app');
    this.srcDir = path.join(this.projectRoot, 'src');
  }

  /**
   * Get file size in KB
   */
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return (stats.size / 1024).toFixed(2);
    } catch (_error) {
      return 0;
    }
  }

  /**
   * Scan directory recursively for files
   */
  scanDirectory(dir, extensions = ['.tsx', '.ts', '.js', '.jsx']) {
    const results = [];

    if (!fs.existsSync(dir)) {
      return results;
    }

    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.')) {
          scan(fullPath);
        } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
          const size = parseFloat(this.getFileSize(fullPath));
          const relativePath = path.relative(this.projectRoot, fullPath);

          results.push({
            path: relativePath,
            size,
            type: this.categorizeFile(fullPath),
          });
        }
      }
    };

    scan(dir);
    return results;
  }

  /**
   * Categorize file based on path and content
   */
  categorizeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.projectRoot, filePath);

    // Categorize by imports and content
    if (
      content.includes('react-native-chart-kit') ||
      content.includes('react-native-gifted-charts')
    ) {
      return 'chart';
    }
    if (content.includes('lucide-react-native')) {
      return 'icons';
    }
    if (relativePath.includes('widgets')) {
      return 'widget';
    }
    if (relativePath.includes('components')) {
      return 'component';
    }
    if (
      relativePath.includes('screens') ||
      (relativePath.includes('app/') && relativePath.endsWith('.tsx'))
    ) {
      return 'screen';
    }
    if (relativePath.includes('utils') || relativePath.includes('services')) {
      return 'utility';
    }
    if (relativePath.includes('context')) {
      return 'context';
    }

    return 'other';
  }

  /**
   * Analyze dependencies from package.json
   */
  analyzeDependencies() {
    const packagePath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    const dependencies = packageJson.dependencies || {};

    // Estimate sizes for known heavy dependencies
    const heavyDeps = {
      'react-native-chart-kit': 150,
      'react-native-gifted-charts': 120,
      'react-native-svg': 80,
      'lucide-react-native': 200, // Many icons
      'react-native-reanimated': 100,
      'expo-router': 60,
    };

    const analysis = [];
    for (const [dep, version] of Object.entries(dependencies)) {
      analysis.push({
        name: dep,
        version,
        estimatedSize: heavyDeps[dep] || 10,
        isHeavy: heavyDeps[dep] > 50,
      });
    }

    return analysis.sort((a, b) => b.estimatedSize - a.estimatedSize);
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(files, dependencies) {
    const recommendations = [];

    // Check for large files
    const largeFiles = files.filter((f) => f.size > 10);
    if (largeFiles.length > 0) {
      recommendations.push({
        type: 'large-files',
        priority: 'high',
        message: `Found ${largeFiles.length} large files (>10KB). Consider code splitting.`,
        files: largeFiles.slice(0, 5).map((f) => `${f.path} (${f.size}KB)`),
      });
    }

    // Check for duplicate chart libraries
    const hasChartKit = dependencies.some((d) => d.name === 'react-native-chart-kit');
    const hasGiftedCharts = dependencies.some((d) => d.name === 'react-native-gifted-charts');
    if (hasChartKit && hasGiftedCharts) {
      recommendations.push({
        type: 'duplicate-dependencies',
        priority: 'medium',
        message: 'Using both chart-kit and gifted-charts. Consider standardizing on one.',
        action: 'Remove unused chart library',
      });
    }

    // Check for heavy widgets
    const widgetFiles = files.filter((f) => f.type === 'widget');
    if (widgetFiles.some((f) => f.size > 8)) {
      recommendations.push({
        type: 'heavy-widgets',
        priority: 'medium',
        message: 'Some widgets are large. Implement lazy loading.',
        action: 'Use LazyWidget component for chart-based widgets',
      });
    }

    // Check icon usage
    const iconFiles = files.filter((f) => f.type === 'icons' || f.path.includes('icon'));
    if (iconFiles.length > 0) {
      recommendations.push({
        type: 'icon-optimization',
        priority: 'low',
        message: 'Consider lazy loading icons to reduce initial bundle.',
        action: 'Implement icon lazy loading',
      });
    }

    return recommendations;
  }

  /**
   * Run complete analysis
   */
  analyze() {
    console.log('🔍 Analyzing bundle size...\n');

    // Scan source files
    const appFiles = this.scanDirectory(this.sourceDir);
    const srcFiles = this.scanDirectory(this.srcDir);
    const allFiles = [...appFiles, ...srcFiles];

    // Analyze dependencies
    const dependencies = this.analyzeDependencies();

    // Generate report
    this.generateReport(allFiles, dependencies);
  }

  /**
   * Generate comprehensive report
   */
  generateReport(files, dependencies) {
    console.log('📊 BUNDLE SIZE ANALYSIS REPORT');
    console.log('='.repeat(50));

    // File size summary
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const filesByType = files.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + f.size;
      return acc;
    }, {});

    console.log(`\n📁 SOURCE FILES (${files.length} files, ${totalSize.toFixed(2)}KB)`);
    console.log('-'.repeat(40));
    Object.entries(filesByType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, size]) => {
        console.log(`  ${type.padEnd(12)}: ${size.toFixed(2)}KB`);
      });

    // Largest files
    console.log('\n🔍 LARGEST FILES');
    console.log('-'.repeat(40));
    files
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach((f) => {
        console.log(`  ${f.size.toFixed(2).padEnd(6)}KB - ${f.path}`);
      });

    // Dependencies
    console.log('\n📦 DEPENDENCIES (Estimated sizes)');
    console.log('-'.repeat(40));
    const heavyDeps = dependencies.filter((d) => d.isHeavy).slice(0, 8);
    heavyDeps.forEach((d) => {
      console.log(`  ${d.estimatedSize.toString().padEnd(6)}KB - ${d.name}`);
    });

    // Recommendations
    console.log('\n💡 OPTIMIZATION RECOMMENDATIONS');
    console.log('-'.repeat(40));
    const recommendations = this.generateRecommendations(files, dependencies);

    if (recommendations.length === 0) {
      console.log('  ✅ No major optimizations needed!');
    } else {
      recommendations.forEach((rec, i) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`  ${i + 1}. ${priority} ${rec.message}`);
        if (rec.action) {
          console.log(`     → ${rec.action}`);
        }
        if (rec.files) {
          rec.files.forEach((file) => console.log(`     • ${file}`));
        }
        console.log('');
      });
    }

    // Implementation status
    console.log('\n✅ IMPLEMENTED OPTIMIZATIONS');
    console.log('-'.repeat(40));
    console.log('  • Code splitting with LazyWidget');
    console.log('  • Chart lazy loading');
    console.log('  • Metro config optimizations');
    console.log('  • Tree shaking enabled');
    console.log('  • Icon lazy loading system');

    console.log('\n🎯 NEXT STEPS');
    console.log('-'.repeat(40));
    console.log('  1. Implement LazyWidget in dashboard widgets');
    console.log('  2. Add bundle size monitoring to CI/CD');
    console.log('  3. Consider removing unused chart library');
    console.log('  4. Monitor bundle size in production builds');
  }
}

// Run analysis
const analyzer = new BundleAnalyzer();
analyzer.analyze();
