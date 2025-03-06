export const adminAuth = (context)=>{
    if (!context.user) throw new Error('Unauthorized');
    if (context.user.role !== "ADMIN") throw new Error('ADMIN access only');
}

export const userAuth = (context)=>{
    if (!context.user) return null;
    // if (context.user.id !== id) throw new Error('Only ADMIN can access other IDs');
    return {userId: context.user.id, role: context.user.role}
}

export const userTaskAuth = (context, id)=>{
    if (!context.user) throw new Error('Unauthorized');
    if (context.user.id !== id) throw new Error('Only ADMIN can access other IDs');
}