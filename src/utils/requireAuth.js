export const adminAuth = (context)=>{
    if (!context.user) throw new Error('Unauthorized');
    if (context.user.role !== "ADMIN") throw new Error('ADMIN access only');
}

export const userAuth = (context, id)=>{
    if (!context.user) throw new Error('Unauthorized');
    if (context.user.id !== id) throw new Error('Only ADMIN can access other IDs');
}

export const userTaskAuth = (context, id)=>{
    if (!context.user) throw new Error('Unauthorized');
    if (context.user.id !== id) throw new Error('Only ADMIN can access other IDs');
}