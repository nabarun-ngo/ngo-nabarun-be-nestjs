import { Injectable } from "@nestjs/common";
import { IDiscoveryProvider } from "src/modules/shared/discovery/interfaces/discovery-provider.interface";
import { SuggestionResult } from "src/modules/shared/discovery/dto/suggestion-result.dto";
import { StaticDocsService } from "../services/static-docs.service";

@Injectable()
export class StaticDocsProvider implements IDiscoveryProvider {
  readonly name = 'static-docs';

  constructor(private readonly staticDocsService: StaticDocsService) {}

  async search(normalizedQuery: string): Promise<SuggestionResult[]> {
    console.log('[StaticDocsProvider] Searching for:', normalizedQuery);
    // Fetch all relevant data from the service
    const [guides, policies] = await Promise.all([
      this.staticDocsService.getUserGuides(),
      this.staticDocsService.getPolicyDocs(),
    ]);

    console.log(`[StaticDocsProvider] Found ${guides.length} guides and ${policies.length} policy groups`);

    const results: SuggestionResult[] = [];

    guides.forEach(group => {
      group.documents.forEach(doc => {
        results.push({
          id: doc.key,
          title: doc.description || doc.key,
          description: `User Guide - ${group.name}`,
          type: 'USER_GUIDE',
          url: doc.value,
          metadata: { category: group.name }
        });
      });
    });

    policies.forEach(group => {
      group.documents.forEach(doc => {
        results.push({
          id: doc.key,
          title: doc.description || doc.key,
          description: `Policy - ${group.name}`,
          type: 'POLICY',
          url: doc.value,
          metadata: { category: group.name }
        });
      });
    });

    return results;
  }
}
