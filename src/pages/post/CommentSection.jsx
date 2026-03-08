import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    getComments, addComment, updateComment, deleteComment,
    getReplies, addReply
} from '../../api/postService';
import { Loader2, Send, CornerDownRight, MoreVertical, Edit2, Trash2, X, MessageCircle } from 'lucide-react';

export default function CommentSection({ postId }) {
    const { userId } = useSelector((state) => state.auth);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentContent, setCommentContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // State for replying
    const [replyingTo, setReplyingTo] = useState(null); // commentId
    const [replyContent, setReplyContent] = useState('');

    // State for editing
    const [editingComment, setEditingComment] = useState(null); // commentId
    const [editContent, setEditContent] = useState('');

    // State to toggle replies visibility
    const [expandedReplies, setExpandedReplies] = useState({}); // { commentId: boolean }

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const data = await getComments(postId);
            // Assuming data is array of comments or data.content
            setComments(data.content || data || []);
        } catch (err) {
            console.error('Failed to load comments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentContent.trim()) return;
        setSubmitting(true);
        try {
            await addComment(postId, commentContent);
            setCommentContent('');
            fetchComments();
        } catch (err) {
            console.error('Failed to add comment', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddReply = async (commentId) => {
        if (!replyContent.trim()) return;
        setSubmitting(true);
        try {
            await addReply(commentId, replyContent);
            setReplyContent('');
            setReplyingTo(null);
            fetchComments(); // Refresh comments which potentially includes replies now
            if (!expandedReplies[commentId]) {
                toggleReplies(commentId);
            }
        } catch (err) {
            console.error('Failed to add reply', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
        try {
            await deleteComment(commentId);
            fetchComments(); // refresh list
        } catch (err) {
            console.error('Failed to delete comment', err);
        }
    };

    const handleUpdateComment = async (commentId) => {
        if (!editContent.trim()) return;
        try {
            await updateComment(commentId, editContent);
            setEditingComment(null);
            setEditContent('');
            fetchComments();
        } catch (err) {
            console.error('Failed to update comment', err);
        }
    };

    const toggleReplies = async (commentId) => {
        // Here we could fetch replies on demand if they are not included, 
        // but let's assume getComments already returns at least first level or we need to call getReplies
        const isExpanded = expandedReplies[commentId];
        setExpandedReplies({ ...expandedReplies, [commentId]: !isExpanded });

        if (!isExpanded) {
            // Load replies if not in comment object (assuming backend doesn't send them recursively)
            try {
                const data = await getReplies(commentId);
                const replies = data.content || data || [];
                setComments(prev => prev.map(c => c.id === commentId ? { ...c, replies } : c));
            } catch (err) {
                console.error('Failed to load replies', err);
            }
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('tr-TR', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            });
        } catch { return ''; }
    };

    const renderComment = (comment, isReply = false, depth = 0) => {
        const isAuthor = userId === comment.authorId;
        const isEditing = editingComment === comment.id;
        const hasReplies = comment.replies && comment.replies.length > 0;
        const showingReplies = expandedReplies[comment.id];

        return (
            <div key={comment.id} className={`flex flex-col gap-2 ${isReply ? 'ml-6 md:ml-10 border-l-2 pl-4 border-slate-100 dark:border-slate-800' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-2xl shadow-sm'}`}>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md`}>
                            {(comment.authorName || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{comment.authorName || 'Anonim'}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(comment.createdAt)}</span>
                        </div>
                    </div>
                    {isAuthor && !isEditing && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingComment(comment.id); setEditContent(comment.content); }} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteComment(comment.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="mt-1">
                    {isEditing ? (
                        <div className="flex flex-col gap-2 mt-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2 mt-1">
                                <button onClick={() => setEditingComment(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">İptal</button>
                                <button onClick={() => handleUpdateComment(comment.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Kaydet</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {comment.content}
                        </p>
                    )}
                </div>

                {/* Actions (Reply Toggle, etc) */}
                {!isEditing && depth < 2 && (
                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                        >
                            <CornerDownRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                            Yanıtla
                        </button>
                        {(!isReply || comment.replyCount > 0) && (
                            <button
                                onClick={() => toggleReplies(comment.id)}
                                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {showingReplies ? 'Yanıtları Gizle' : (comment.replyCount > 0 ? `${comment.replyCount} Yanıtı Gör` : 'Yanıtları Gör')}
                            </button>
                        )}
                    </div>
                )}

                {/* Reply Input Box */}
                {replyingTo === comment.id && (
                    <div className="mt-3 flex items-start gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="w-6 h-6 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                            <span className="text-[10px] text-white font-bold">U</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={`Yanıtla: ${comment.authorName}...`}
                                className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-slate-900 dark:text-white resize-none min-h-[40px]"
                                rows={2}
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleAddReply(comment.id)}
                                    disabled={submitting || !replyContent.trim()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                                >
                                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    Gönder
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Render Nested Replies */}
                {showingReplies && comment.replies && comment.replies.length > 0 && (
                    <div className="flex flex-col gap-4 mt-4">
                        {comment.replies.map(reply => renderComment(reply, true, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mt-12 space-y-8">
            <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Yorumlar</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold">{comments.length}</span>
            </div>

            {/* New Comment Box */}
            <form onSubmit={handleAddComment} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Sen</span>
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            placeholder="Düşüncelerinizi paylaşın..."
                            className="w-full bg-transparent border-none p-2 text-slate-900 dark:text-white focus:ring-0 resize-none min-h-[60px]"
                            rows={3}
                        />
                        <div className="flex justify-end mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={submitting || !commentContent.trim()}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Paylaş
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Comments List */}
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : comments.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                    <p className="text-slate-500 dark:text-slate-400">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {comments.map(comment => renderComment(comment, false, 0))}
                </div>
            )}
        </div>
    );
}
