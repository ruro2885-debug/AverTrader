import fs from 'fs';
import path from 'path';

interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  entitiesFound: string[];
}

const PRIMARY_DOMAIN = 'https://www.avertrader.space';

export function validateSchemaInHtml(htmlContent: string): SchemaValidationResult {
  const result: SchemaValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    entitiesFound: [],
  };

  // Extract all application/ld+json blocks
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let foundAny = false;

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    foundAny = true;
    const jsonString = match[1].trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err: any) {
      result.valid = false;
      result.errors.push(`JSON Syntax Error in schema script block: ${err.message}`);
      continue;
    }

    // Validate Schema structure
    validateSchemaObject(parsed, result);
  }

  if (!foundAny) {
    result.valid = false;
    result.errors.push('No application/ld+json script tags found in HTML');
  }

  return result;
}

function validateSchemaObject(obj: any, result: SchemaValidationResult) {
  if (!obj || typeof obj !== 'object') {
    result.valid = false;
    result.errors.push('Schema root must be an object');
    return;
  }

  // Check @context
  if (obj['@context'] !== 'https://schema.org' && obj['@context'] !== 'http://schema.org') {
    result.valid = false;
    result.errors.push(`Invalid @context: "${obj['@context']}". Must be "https://schema.org"`);
  }

  // Handle @graph array or single entity
  if (Array.isArray(obj['@graph'])) {
    if (obj['@graph'].length === 0) {
      result.valid = false;
      result.errors.push('@graph array cannot be empty');
    }
    for (const item of obj['@graph']) {
      validateEntity(item, result);
    }
  } else {
    validateEntity(obj, result);
  }
}

function validateEntity(entity: any, result: SchemaValidationResult) {
  if (!entity || typeof entity !== 'object') {
    result.valid = false;
    result.errors.push('Invalid entity in schema graph');
    return;
  }

  const rawType = entity['@type'];
  if (!rawType) {
    result.valid = false;
    result.errors.push('Missing @type declaration in entity');
    return;
  }

  const types: string[] = Array.isArray(rawType) ? rawType : [rawType];
  result.entitiesFound.push(types.join(' + '));

  for (const type of types) {
    switch (type) {
      case 'SoftwareApplication':
      case 'FinancialApplication':
        validateSoftwareApplication(entity, result);
        break;
      case 'WebSite':
        validateWebSite(entity, result);
        break;
      case 'Organization':
        validateOrganization(entity, result);
        break;
      case 'FAQPage':
        validateFAQPage(entity, result);
        break;
      case 'Question':
      case 'Answer':
      case 'Offer':
      case 'ImageObject':
      case 'ContactPoint':
        // Sub-entities validated within parents
        break;
      default:
        result.warnings.push(`Uncommon Schema.org type encountered: ${type}`);
    }
  }
}

function validateSoftwareApplication(entity: any, result: SchemaValidationResult) {
  if (!entity.name || typeof entity.name !== 'string') {
    result.valid = false;
    result.errors.push('SoftwareApplication must have a valid "name" property');
  }

  if (!entity.applicationCategory) {
    result.valid = false;
    result.errors.push('SoftwareApplication must have an "applicationCategory"');
  }

  if (!entity.description || entity.description.length < 20) {
    result.warnings.push('SoftwareApplication description is very short; richer text improves AI summaries');
  }

  if (entity.url && !entity.url.startsWith('https://')) {
    result.warnings.push(`SoftwareApplication url "${entity.url}" should use https://`);
  }
}

function validateWebSite(entity: any, result: SchemaValidationResult) {
  if (!entity.name) {
    result.valid = false;
    result.errors.push('WebSite entity must have a "name"');
  }
  if (!entity.url) {
    result.valid = false;
    result.errors.push('WebSite entity must have a "url"');
  }
}

function validateOrganization(entity: any, result: SchemaValidationResult) {
  if (!entity.name) {
    result.valid = false;
    result.errors.push('Organization entity must have a "name"');
  }
  if (!entity.url) {
    result.valid = false;
    result.errors.push('Organization entity must have a "url"');
  }
  if (!entity.logo) {
    result.warnings.push('Organization entity missing "logo" property for Knowledge Graph snippets');
  }
}

function validateFAQPage(entity: any, result: SchemaValidationResult) {
  if (!Array.isArray(entity.mainEntity) || entity.mainEntity.length === 0) {
    result.valid = false;
    result.errors.push('FAQPage must have a non-empty "mainEntity" array of Questions');
    return;
  }

  entity.mainEntity.forEach((q: any, index: number) => {
    if (q['@type'] !== 'Question') {
      result.valid = false;
      result.errors.push(`FAQ item #${index + 1} @type must be "Question" (got: "${q['@type']}")`);
    }
    if (!q.name || typeof q.name !== 'string' || q.name.trim().length === 0) {
      result.valid = false;
      result.errors.push(`FAQ item #${index + 1} Question is missing "name" question text`);
    }
    if (!q.acceptedAnswer || q.acceptedAnswer['@type'] !== 'Answer') {
      result.valid = false;
      result.errors.push(`FAQ item #${index + 1} Question must have an acceptedAnswer of @type "Answer"`);
    } else if (!q.acceptedAnswer.text || q.acceptedAnswer.text.length < 30) {
      result.warnings.push(`FAQ item #${index + 1} answer is short. Dense paragraphs optimize AI Overviews.`);
    }
  });
}

// Standalone execution runner
function run() {
  const htmlPath = path.resolve(process.cwd(), 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ [Schema Validator] index.html not found at: ${htmlPath}`);
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  console.log('🔍 [Schema Validator] Inspecting JSON-LD structured data in index.html...');
  
  const validation = validateSchemaInHtml(htmlContent);

  console.log('\n📊 Entities Detected:');
  validation.entitiesFound.forEach(e => console.log(`  ✓ ${e}`));

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(w => console.log(`  • ${w}`));
  }

  if (!validation.valid || validation.errors.length > 0) {
    console.error('\n❌ Schema Validation FAILED:');
    validation.errors.forEach(e => console.error(`  ✖ ${e}`));
    process.exit(1);
  }

  console.log('\n✅ [Schema Validator] All JSON-LD Schema.org types and structures are valid!\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
