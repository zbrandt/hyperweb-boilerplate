import { join } from 'path';
import { InterwebBuild, InterwebBuildOptions } from '@interweb/build';

const root = join(__dirname, '/../');
const outputDir = join(root, 'contracts');
const srcDir = join(root, 'src');

async function main() {
  const outfile = join(outputDir, 'bundle.js');
    
  const options: Partial<InterwebBuildOptions> = {
    entryPoints: [join(srcDir, 'contract1/index.ts')],
    outfile,
    external: ['otherpackage', '~somepackage']
  };

  try {
    await InterwebBuild.build(options);
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
  }
}

main().catch(console.error);