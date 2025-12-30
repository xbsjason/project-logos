import {
    collection,
    doc,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    query,
    where,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Standard violation categories for social media
export type ViolationReason =
    | 'spam'
    | 'harassment'
    | 'hate_speech'
    | 'inappropriate'
    | 'violence'
    | 'false_info'
    | 'copyright'
    | 'other';

export const VIOLATION_LABELS: Record<ViolationReason, string> = {
    spam: 'Spam or misleading',
    harassment: 'Harassment or bullying',
    hate_speech: 'Hate speech or symbols',
    inappropriate: 'Inappropriate content',
    violence: 'Violence or dangerous behavior',
    false_info: 'False information',
    copyright: 'Copyright infringement',
    other: 'Other'
};

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';

export interface Report {
    id: string;
    type: 'post' | 'user' | 'comment';
    targetId: string; // postId, userId, or commentId
    contextId?: string; // e.g. postId for comments
    reporterId: string;
    reason: ViolationReason;
    details?: string;
    status: ReportStatus;
    createdAt: Timestamp;
    reviewedAt?: Timestamp;
    reviewedBy?: string;
    action?: string;
}

export interface ReportedPost {
    report: Report;
    post: {
        id: string;
        content: string;
        authorId: string;
        type: string;
    } | null;
    reportCount: number;
}

export interface ReportedComment {
    report: Report;
    comment: {
        id: string;
        text: string;
        userId: string;
        postId: string;
    } | null;
    reportCount: number;
}

export interface ReportedUser {
    userId: string;
    reports: Report[];
    reportCount: number;
    userProfile?: {
        displayName: string | null;
        username: string | null;
        photoURL: string | null;
    };
}

export const ReportService = {
    // Report a post
    async reportPost(
        postId: string,
        reporterId: string,
        reason: ViolationReason,
        details?: string
    ): Promise<string> {
        const reportData = {
            type: 'post' as const,
            targetId: postId,
            reporterId,
            reason,
            details: details || null,
            status: 'pending' as ReportStatus,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'reports'), reportData);
        return docRef.id;
    },

    // Report a comment
    async reportComment(
        commentId: string,
        postId: string,
        reporterId: string,
        reason: ViolationReason,
        details?: string
    ): Promise<string> {
        const reportData = {
            type: 'comment' as const,
            targetId: commentId,
            contextId: postId,
            reporterId,
            reason,
            details: details || null,
            status: 'pending' as ReportStatus,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'reports'), reportData);
        return docRef.id;
    },

    // Report a user
    async reportUser(
        userId: string,
        reporterId: string,
        reason: ViolationReason,
        details?: string
    ): Promise<string> {
        const reportData = {
            type: 'user' as const,
            targetId: userId,
            reporterId,
            reason,
            details: details || null,
            status: 'pending' as ReportStatus,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'reports'), reportData);
        return docRef.id;
    },

    // Get all reported posts
    async getReportedPosts(status?: ReportStatus): Promise<ReportedPost[]> {
        const q = query(
            collection(db, 'reports'),
            where('type', '==', 'post')
        );
        const snapshot = await getDocs(q);

        const reportsByPost = new Map<string, Report[]>();

        snapshot.docs.forEach(docItem => {
            const report = { id: docItem.id, ...docItem.data() } as Report;
            if (status && report.status !== status) return;

            const existing = reportsByPost.get(report.targetId) || [];
            existing.push(report);
            reportsByPost.set(report.targetId, existing);
        });

        const results: ReportedPost[] = [];

        for (const [postId, reports] of reportsByPost) {
            let postData = null;
            try {
                const postDoc = await getDoc(doc(db, 'posts', postId));
                if (postDoc.exists()) {
                    const data = postDoc.data();
                    postData = {
                        id: postDoc.id,
                        content: data.content || '',
                        authorId: data.authorId || '',
                        type: data.type || 'unknown'
                    };
                }
            } catch (e) {
                console.error('Error fetching post:', e);
            }

            results.push({
                report: reports[0],
                post: postData,
                reportCount: reports.length
            });
        }

        return results;
    },

    // Get reported comments
    async getReportedComments(status?: ReportStatus): Promise<ReportedComment[]> {
        const q = query(
            collection(db, 'reports'),
            where('type', '==', 'comment')
        );
        const snapshot = await getDocs(q);

        // Group by comment ID
        const reportsByComment = new Map<string, Report[]>();

        snapshot.docs.forEach(docItem => {
            const report = { id: docItem.id, ...docItem.data() } as Report;
            if (status && report.status !== status) return;

            const existing = reportsByComment.get(report.targetId) || [];
            existing.push(report);
            reportsByComment.set(report.targetId, existing);
        });

        const results: ReportedComment[] = [];

        for (const [commentId, reports] of reportsByComment) {
            const postId = reports[0].contextId;
            let commentData = null;

            if (postId) {
                try {
                    const commentDoc = await getDoc(doc(db, 'posts', postId, 'comments', commentId));
                    if (commentDoc.exists()) {
                        const data = commentDoc.data();
                        commentData = {
                            id: commentDoc.id,
                            text: data.text || '',
                            userId: data.userId || '',
                            postId: postId
                        };
                    }
                } catch (e) {
                    console.error('Error fetching comment:', e);
                }
            }

            results.push({
                report: reports[0], // Representative report
                comment: commentData,
                reportCount: reports.length
            });
        }

        return results;
    },

    // Get all reported users
    async getReportedUsers(status?: ReportStatus): Promise<ReportedUser[]> {
        const q = query(
            collection(db, 'reports'),
            where('type', '==', 'user')
        );
        const snapshot = await getDocs(q);

        const reportsByUser = new Map<string, Report[]>();

        snapshot.docs.forEach(docItem => {
            const report = { id: docItem.id, ...docItem.data() } as Report;
            if (status && report.status !== status) return;

            const existing = reportsByUser.get(report.targetId) || [];
            existing.push(report);
            reportsByUser.set(report.targetId, existing);
        });

        const results: ReportedUser[] = [];

        for (const [userId, reports] of reportsByUser) {
            let userProfile = undefined;
            try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    userProfile = {
                        displayName: data.displayName || null,
                        username: data.username || null,
                        photoURL: data.photoURL || null
                    };
                }
            } catch (e) {
                console.error('Error fetching user:', e);
            }

            results.push({
                userId,
                reports,
                reportCount: reports.length,
                userProfile
            });
        }

        return results;
    },

    // Update report status (admin action)
    async updateReportStatus(
        reportId: string,
        status: ReportStatus,
        reviewedBy: string,
        action?: string
    ): Promise<void> {
        await updateDoc(doc(db, 'reports', reportId), {
            status,
            reviewedAt: serverTimestamp(),
            reviewedBy,
            ...(action && { action })
        });
    },

    // Dismiss all reports for a target
    async dismissReportsForTarget(
        targetId: string,
        type: 'post' | 'user' | 'comment',
        reviewedBy: string
    ): Promise<void> {
        const q = query(
            collection(db, 'reports'),
            where('targetId', '==', targetId),
            where('type', '==', type),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);

        const updates = snapshot.docs.map(docSnap =>
            updateDoc(doc(db, 'reports', docSnap.id), {
                status: 'dismissed',
                reviewedAt: serverTimestamp(),
                reviewedBy
            })
        );

        await Promise.all(updates);
    },

    // Get report counts for dashboard
    async getReportCounts(): Promise<{
        pendingPosts: number;
        pendingUsers: number;
        pendingComments: number;
        total: number;
    }> {
        const pendingQuery = query(
            collection(db, 'reports'),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(pendingQuery);

        let pendingPosts = 0;
        let pendingUsers = 0;
        let pendingComments = 0;

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.type === 'post') pendingPosts++;
            else if (data.type === 'user') pendingUsers++;
            else if (data.type === 'comment') pendingComments++;
        });

        return {
            pendingPosts,
            pendingUsers,
            pendingComments,
            total: pendingPosts + pendingUsers + pendingComments
        };
    }
};
