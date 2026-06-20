/**
 * Pendo Track Events for TailorCV
 *
 * Usage:
 *   import { trackResumeUploaded, trackAiFeedbackRequested } from './pendo-track';
 *
 *   // After a successful resume upload:
 *   trackResumeUploaded({ fileType: 'pdf', fileSize: 204800, fileName: 'resume.pdf', uploadSource: 'dashboard' });
 *
 *   // After requesting AI feedback:
 *   trackAiFeedbackRequested({ resumeId: 'abc', feedbackType: 'full', jobDescriptionProvided: true, resumeSectionCount: 5 });
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pendoTrack(eventName, properties) {
  try {
    if (typeof pendo !== "undefined" && typeof pendo.track === "function") {
      pendo.track(eventName, properties);
    }
  } catch (_) {
    // Never let tracking break application flow
  }
}

// ---------------------------------------------------------------------------
// Resume Management Events
// ---------------------------------------------------------------------------

/**
 * Fires after a resume file upload succeeds.
 * @param {{ fileType: string, fileSize: number, fileName: string, uploadSource: string }} props
 */
export function trackResumeUploaded(props) {
  pendoTrack("resume_uploaded", {
    fileType: props.fileType,
    fileSize: props.fileSize,
    fileName: props.fileName,
    uploadSource: props.uploadSource,
  });
}

/**
 * Fires after a new resume is created from scratch and persisted.
 * @param {{ resumeId: string, templateUsed: string, sectionCount: number, creationMethod: string }} props
 */
export function trackResumeCreated(props) {
  pendoTrack("resume_created", {
    resumeId: props.resumeId,
    templateUsed: props.templateUsed,
    sectionCount: props.sectionCount,
    creationMethod: props.creationMethod,
  });
}

/**
 * Fires after a resume deletion is confirmed server-side.
 * @param {{ resumeId: string, resumeAge: number, hadFeedback: boolean, hadTailoring: boolean }} props
 */
export function trackResumeDeleted(props) {
  pendoTrack("resume_deleted", {
    resumeId: props.resumeId,
    resumeAge: props.resumeAge,
    hadFeedback: props.hadFeedback,
    hadTailoring: props.hadTailoring,
  });
}

/**
 * Fires after a resume export/download completes.
 * @param {{ resumeId: string, exportFormat: string, wasTailored: boolean, hadFeedbackApplied: boolean }} props
 */
export function trackResumeExported(props) {
  pendoTrack("resume_exported", {
    resumeId: props.resumeId,
    exportFormat: props.exportFormat,
    wasTailored: props.wasTailored,
    hadFeedbackApplied: props.hadFeedbackApplied,
  });
}

/**
 * Fires after a bulk action on multiple resumes completes.
 * @param {{ actionType: string, itemCount: number, successCount: number, failureCount: number }} props
 */
export function trackBulkResumeAction(props) {
  pendoTrack("bulk_resume_action", {
    actionType: props.actionType,
    itemCount: props.itemCount,
    successCount: props.successCount,
    failureCount: props.failureCount,
  });
}

/**
 * Fires after a resume is shared via link, email, or other method.
 * @param {{ resumeId: string, shareMethod: string, recipientCount: number, wasTailored: boolean }} props
 */
export function trackResumeShared(props) {
  pendoTrack("resume_shared", {
    resumeId: props.resumeId,
    shareMethod: props.shareMethod,
    recipientCount: props.recipientCount,
    wasTailored: props.wasTailored,
  });
}

// ---------------------------------------------------------------------------
// AI Feedback Events
// ---------------------------------------------------------------------------

/**
 * Fires when a resume is submitted for AI feedback analysis.
 * @param {{ resumeId: string, feedbackType: string, jobDescriptionProvided: boolean, resumeSectionCount: number }} props
 */
export function trackAiFeedbackRequested(props) {
  pendoTrack("ai_feedback_requested", {
    resumeId: props.resumeId,
    feedbackType: props.feedbackType,
    jobDescriptionProvided: props.jobDescriptionProvided,
    resumeSectionCount: props.resumeSectionCount,
  });
}

/**
 * Fires when AI feedback analysis completes and results are returned.
 * @param {{ resumeId: string, feedbackScore: number, issueCount: number, suggestionCount: number, processingDuration: number, feedbackCategories: string }} props
 */
export function trackAiFeedbackCompleted(props) {
  pendoTrack("ai_feedback_completed", {
    resumeId: props.resumeId,
    feedbackScore: props.feedbackScore,
    issueCount: props.issueCount,
    suggestionCount: props.suggestionCount,
    processingDuration: props.processingDuration,
    feedbackCategories: props.feedbackCategories,
  });
}

/**
 * Fires when a user applies AI-generated suggestions to their resume.
 * @param {{ resumeId: string, suggestionsAppliedCount: number, totalSuggestionsAvailable: number, suggestionCategories: string }} props
 */
export function trackAiFeedbackApplied(props) {
  pendoTrack("ai_feedback_applied", {
    resumeId: props.resumeId,
    suggestionsAppliedCount: props.suggestionsAppliedCount,
    totalSuggestionsAvailable: props.totalSuggestionsAvailable,
    suggestionCategories: props.suggestionCategories,
  });
}

// ---------------------------------------------------------------------------
// Resume Tailoring Events
// ---------------------------------------------------------------------------

/**
 * Fires when a user initiates tailoring a resume to a job description.
 * @param {{ resumeId: string, jobDescriptionLength: number, jobTitle: string, jobIndustry: string }} props
 */
export function trackResumeTailoringStarted(props) {
  pendoTrack("resume_tailoring_started", {
    resumeId: props.resumeId,
    jobDescriptionLength: props.jobDescriptionLength,
    jobTitle: props.jobTitle,
    jobIndustry: props.jobIndustry,
  });
}

/**
 * Fires when the resume tailoring process finishes.
 * @param {{ resumeId: string, jobDescriptionId: string, matchScore: number, changesCount: number, sectionsModified: number, processingDuration: number }} props
 */
export function trackResumeTailoringCompleted(props) {
  pendoTrack("resume_tailoring_completed", {
    resumeId: props.resumeId,
    jobDescriptionId: props.jobDescriptionId,
    matchScore: props.matchScore,
    changesCount: props.changesCount,
    sectionsModified: props.sectionsModified,
    processingDuration: props.processingDuration,
  });
}

/**
 * Fires when a user submits a job description for tailoring.
 * @param {{ inputMethod: string, jobDescriptionLength: number, jobTitle: string, companyName: string, jobIndustry: string }} props
 */
export function trackJobDescriptionSubmitted(props) {
  pendoTrack("job_description_submitted", {
    inputMethod: props.inputMethod,
    jobDescriptionLength: props.jobDescriptionLength,
    jobTitle: props.jobTitle,
    companyName: props.companyName,
    jobIndustry: props.jobIndustry,
  });
}

/**
 * Fires when a user accepts and saves a tailored resume.
 * @param {{ resumeId: string, jobDescriptionId: string, matchScore: number, changesAccepted: number, changesRejected: number }} props
 */
export function trackTailoredResumeAccepted(props) {
  pendoTrack("tailored_resume_accepted", {
    resumeId: props.resumeId,
    jobDescriptionId: props.jobDescriptionId,
    matchScore: props.matchScore,
    changesAccepted: props.changesAccepted,
    changesRejected: props.changesRejected,
  });
}

// ---------------------------------------------------------------------------
// Account & Settings Events
// ---------------------------------------------------------------------------

/**
 * Fires when a new user successfully signs up.
 * @param {{ signupMethod: string, referralSource: string, planSelected: string }} props
 */
export function trackAccountCreated(props) {
  pendoTrack("account_created", {
    signupMethod: props.signupMethod,
    referralSource: props.referralSource,
    planSelected: props.planSelected,
  });
}

/**
 * Fires when a user updates their account settings.
 * @param {{ settingsChanged: string, settingCategory: string }} props
 */
export function trackSettingsUpdated(props) {
  pendoTrack("settings_updated", {
    settingsChanged: props.settingsChanged,
    settingCategory: props.settingCategory,
  });
}

// ---------------------------------------------------------------------------
// Dashboard Events
// ---------------------------------------------------------------------------

/**
 * Fires when a user searches or filters resumes on the dashboard.
 * @param {{ searchQuery: string, filtersApplied: string, resultsCount: number, sortOrder: string }} props
 */
export function trackResumeSearchExecuted(props) {
  pendoTrack("resume_search_executed", {
    searchQuery: props.searchQuery,
    filtersApplied: props.filtersApplied,
    resultsCount: props.resultsCount,
    sortOrder: props.sortOrder,
  });
}
