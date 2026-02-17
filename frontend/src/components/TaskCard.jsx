
// Priority Colors
const getPriorityColor = (priority) => {
  switch (priority.toLowerCase()) {
    case 'urgent': return 'bg-red-500/20 text-red-500 border-red-500/50';
    case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
    case 'medium': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
  }
};

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'completed': return 'text-emerald-400';
    case 'in progress': return 'text-blue-400';
    case 'verified': return 'text-purple-400';
    default: return 'text-slate-400';
  }
};

const TaskCard = ({ task, onUpdateStatus }) => {
  return (
    <div className="glass-card flex flex-col gap-3 relative overflow-hidden group">
      {/* Decorative Gradient Blob */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-color opacity-10 blur-2xl rounded-full group-hover:opacity-20 transition-opacity"></div>

      <div className="flex justify-between items-start z-10">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        <span className={`text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
      </div>

      <h3 className="text-lg font-bold text-white z-10">{task.title}</h3>
      <p className="text-sm text-slate-400 line-clamp-2 z-10">{task.description}</p>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5 z-10">
        <div className="flex flex-col">
           <span className="text-[10px] text-slate-500 uppercase tracking-wider">Due Date</span>
           <span className="text-xs text-slate-300">
             {new Date(task.dueDate).toLocaleDateString()}
           </span>
        </div>
        
        <button 
          onClick={() => onUpdateStatus(task._id)}
          className="btn btn-primary text-xs py-2 px-4"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
