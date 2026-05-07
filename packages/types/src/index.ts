export interface Greeting {
  message: string;
  at: string;
}

export interface SkillManifest {
  name: string;
  version: string;
  description?: string;
}

export interface SkillSummary {
  name: string;
  version: string;
  uploadedAt: string;
}

export interface SkillDetail extends SkillSummary {
  manifest: SkillManifest;
  files: string[];
}
