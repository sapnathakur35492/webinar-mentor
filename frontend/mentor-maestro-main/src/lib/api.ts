import axios from 'axios';

// Use environment variable for API base URL - change in .env for production
const API_Base = `${import.meta.env.VITE_API_BASE_URL || 'https://devwebinar.change20.no/api'}/webinar`;

export interface WebinarAsset {
  id: string;
  mentor_id: string;
  onboarding_doc_content?: string;
  hook_analysis_content?: string;
  concepts_original?: any[];
  concepts_evaluated?: string;
  concepts_improved?: any[];
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  asset_id?: string;
  error?: string;
  created_at?: string;
  updated_at?: string;
}

export const api = {
  // 1. Upload Context (Setup Step 2) - Returns immediately with job_id
  uploadContext: async (
    mentorId: string,
    onboardingDoc: string,
    hookAnalysis: string,
    file?: File,
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    formData.append('mentor_id', mentorId);
    formData.append('onboarding_doc', onboardingDoc || "Generated from profile");
    formData.append('hook_analysis', hookAnalysis || "Pending analysis");

    if (file) {
      formData.append('file', file);
    }

    // Call Python Backend - Now returns immediately with job_id
    const response = await axios.post(`${API_Base}/upload-context`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    return response.data; // { status: "accepted", job_id: "...", message: "..." }
  },

  // 1.5 Get Job Status (for polling background jobs)
  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await axios.get(`${API_Base}/jobs/${jobId}/status`);
    return response.data;
  },

  // 2. Generate Concepts
  generateConcepts: async (assetId: string) => {
    const response = await axios.post(`${API_Base}/concepts/generate`, {
      asset_id: assetId
    });
    return response.data; // { status: "success", data: { ... } }
  },

  // 3. Generate Structure (Slide Outline)
  generateStructure: async (assetId: string, conceptText: string) => {
    const response = await axios.post(`${API_Base}/structure/generate`, {
      asset_id: assetId,
      concept_text: conceptText
    });
    return response.data; // { status: "success", structure: "..." }
  },

  // 4. Generate Emails
  generateEmails: async (assetId: string, structureText: string, productDetails: string) => {
    const response = await axios.post(`${API_Base}/emails/generate`, {
      asset_id: assetId,
      structure_text: structureText,
      product_details: productDetails
    });
    return response.data;
  },

  // 5. Generate Individual Email (Deep Loop)
  generateSingleEmail: async (emailOutline: string, conceptContext: string) => {
    const response = await axios.post(`${API_Base}/emails/generate-single`, {
      email_outline: emailOutline,
      concept_context: conceptContext
    });
    return response.data;
  },

  // 6. Generate Video
  generateVideo: async (scriptText: string, sourceUrl?: string) => {
    const response = await axios.post(`${API_Base}/video/generate`, {
      script_text: scriptText,
      source_url: sourceUrl
    });
    return response.data;
  },

  // 7. Get Asset Status
  getAsset: async (assetId: string) => {
    const response = await axios.get(`${API_Base}/assets/${assetId}`);
    return response.data;
  },

  selectConcept: async (assetId: string, conceptIndex: number, fromImproved: boolean = true) => {
    const response = await axios.post(`${API_Base}/assets/${assetId}/select-concept`, {
      concept_index: conceptIndex,
      from_improved: fromImproved
    });
    return response.data;
  },

  // 9. Get Video Status
  getVideoStatus: async (talkId: string) => {
    const response = await axios.get(`${API_Base}/video/${talkId}`);
    return response.data;
  },

  // 10. Generate Promotional Image
  generatePromotionalImage: async (conceptId: string, mediaType: string, conceptText?: string) => {
    const response = await axios.post(`${API_Base}/images/generate`, {
      concept_id: conceptId,
      media_type: mediaType,
      concept_text: conceptText
    });
    return response.data;
  },

  // 11. Generate Marketing Copy
  generateMarketingCopy: async (conceptId: string, mediaType: string) => {
    const response = await axios.post(`${API_Base}/marketing/generate`, {
      concept_id: conceptId,
      media_type: mediaType
    });
    return response.data;
  }
};
