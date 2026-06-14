from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
import models
import schemas
import database

router = APIRouter(tags=["Community & MyPage"])


def ensure_community_like_schema():
    with database.engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS COMMUNITY_POST_LIKES (
                like_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                post_id BIGINT NOT NULL,
                user_id BIGINT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_community_post_likes_post_id (post_id),
                INDEX idx_community_post_likes_user_id (user_id)
            )
        """))
        duplicate_index = conn.execute(
            text("SHOW INDEX FROM COMMUNITY_POST_LIKES WHERE Key_name = 'uq_community_post_like_user'")
        ).first()
        if not duplicate_index:
            conn.execute(text(
                "ALTER TABLE COMMUNITY_POST_LIKES ADD CONSTRAINT uq_community_post_like_user UNIQUE (post_id, user_id)"
            ))


@router.get("/api/community/posts")
def get_community_posts(user_id: int | None = Query(None), db: Session = Depends(database.get_db)):
    try:
        like_count_subquery = (
            db.query(
                models.CommunityPostLike.post_id.label("post_id"),
                func.count(models.CommunityPostLike.like_id).label("like_count"),
            )
            .group_by(models.CommunityPostLike.post_id)
            .subquery()
        )
        results = db.query(
            models.CommunityPost,
            func.coalesce(models.User.nickname, models.User.name).label("display_name"),
            models.User.role,
            models.User.pregnancy_start_date,
            func.count(models.CommunityComment.comment_id).label("comment_count"),
            func.coalesce(like_count_subquery.c.like_count, 0).label("like_count"),
        ).outerjoin(
            models.User, models.CommunityPost.user_id == models.User.id
        ).outerjoin(
            models.CommunityComment, models.CommunityPost.post_id == models.CommunityComment.post_id
        ).outerjoin(
            like_count_subquery, models.CommunityPost.post_id == like_count_subquery.c.post_id
        ).group_by(
            models.CommunityPost.post_id, models.User.id, like_count_subquery.c.like_count
        ).order_by(models.CommunityPost.created_at.desc()).all()

        liked_post_ids = set()
        if user_id:
            liked_post_ids = {
                row.post_id
                for row in db.query(models.CommunityPostLike.post_id)
                .filter(models.CommunityPostLike.user_id == user_id)
                .all()
            }

        posts = [
            {
                "post_id": p.post_id,
                "user_id": p.user_id,
                "pregnancy_period": p.pregnancy_period,
                "title": p.title,
                "content": p.content,
                "created_at": p.created_at,
                "author": uname or "익명",
                "role": urole,
                "comment_count": count,
                "like_count": int(like_count or 0),
                "liked_by_me": p.post_id in liked_post_ids,
            }
            for p, uname, urole, preg_date, count, like_count in results
        ]
        return {"status": "Success", "posts": posts}
    except Exception as e: return {"status": "Error", "message": str(e)}

@router.post("/api/community/posts")
def create_community_post(post: schemas.PostCreate, db: Session = Depends(database.get_db)):
    if not db.query(models.User).filter(models.User.id == post.user_id).first():
        raise HTTPException(status_code=404, detail="작성자 계정을 찾을 수 없습니다.")
    title = post.title.strip()
    content = post.content.strip()
    if not title or not content:
        raise HTTPException(status_code=400, detail="제목과 내용을 모두 입력해 주세요.")
    db.add(models.CommunityPost(
        user_id=post.user_id,
        pregnancy_period=post.pregnancy_period.strip(),
        title=title,
        content=content,
    ))
    db.commit()
    return {"status": "Success"}

@router.delete("/api/community/posts/{post_id}")
def delete_community_post(post_id: int, user_id: int, db: Session = Depends(database.get_db)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.post_id == post_id).first()
    if not post: raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if post.user_id != user_id:
        raise HTTPException(status_code=403, detail="본인이 작성한 게시글만 삭제할 수 있습니다.")
    db.query(models.CommunityPostLike).filter(models.CommunityPostLike.post_id == post_id).delete()
    db.query(models.CommunityComment).filter(models.CommunityComment.post_id == post_id).delete()
    db.delete(post); db.commit()
    return {"status": "Success"}

@router.put("/api/community/posts/{post_id}")
def update_community_post(post_id: int, post_data: schemas.PostUpdate, db: Session = Depends(database.get_db)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if post.user_id != post_data.user_id:
        raise HTTPException(status_code=403, detail="본인이 작성한 게시글만 수정할 수 있습니다.")

    title = post_data.title.strip()
    content = post_data.content.strip()
    if not title or not content:
        raise HTTPException(status_code=400, detail="제목과 내용을 모두 입력해 주세요.")

    post.title = title
    post.content = content
    db.commit()
    return {"status": "Success"}


@router.post("/api/community/posts/{post_id}/like")
def toggle_community_post_like(post_id: int, user_id: int, db: Session = Depends(database.get_db)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if not db.query(models.User).filter(models.User.id == user_id).first():
        raise HTTPException(status_code=404, detail="사용자 계정을 찾을 수 없습니다.")

    existing = db.query(models.CommunityPostLike).filter(
        models.CommunityPostLike.post_id == post_id,
        models.CommunityPostLike.user_id == user_id,
    ).first()

    if existing:
        db.delete(existing)
        liked = False
    else:
        db.add(models.CommunityPostLike(post_id=post_id, user_id=user_id))
        liked = True

    db.commit()
    like_count = db.query(models.CommunityPostLike).filter(models.CommunityPostLike.post_id == post_id).count()
    return {"status": "Success", "liked": liked, "like_count": like_count}

@router.get("/api/posts/{post_id}/comments")
def get_post_comments(post_id: int, db: Session = Depends(database.get_db)):
    try:
        comments = db.query(models.CommunityComment, func.coalesce(models.User.nickname, models.User.name), models.User.role, models.User.pregnancy_start_date).outerjoin(models.User, models.CommunityComment.user_id == models.User.id).filter(models.CommunityComment.post_id == post_id).order_by(models.CommunityComment.created_at.asc()).all()
        return {"status": "Success", "comments": [{"id": c.comment_id, "user_id": c.user_id, "content": c.content, "created_at": c.created_at, "author_name": uname or "익명", "author_role": urole, "pregnancy_start_date": str(sdate) if sdate else None} for c, uname, urole, sdate in comments]}
    except Exception as e: return {"status": "Error", "message": str(e)}

@router.post("/api/posts/{post_id}/comments")
def create_post_comment(post_id: int, comment_data: schemas.CommentCreate, db: Session = Depends(database.get_db)):
    try:
        if not db.query(models.CommunityPost).filter(models.CommunityPost.post_id == post_id).first():
            raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
        if not db.query(models.User).filter(models.User.id == comment_data.user_id).first():
            raise HTTPException(status_code=404, detail="작성자 계정을 찾을 수 없습니다.")
        content = comment_data.content.strip()
        if not content:
            raise HTTPException(status_code=400, detail="댓글 내용을 입력해 주세요.")
        db.add(models.CommunityComment(post_id=post_id, user_id=comment_data.user_id, content=content))
        db.commit()
        return {"status": "Success"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback(); return {"status": "Error", "message": str(e)}

@router.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: int, user_id: int, db: Session = Depends(database.get_db)):
    comment = db.query(models.CommunityComment).filter(models.CommunityComment.comment_id == comment_id).first()
    if not comment: raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != user_id: raise HTTPException(status_code=403, detail="본인이 작성한 댓글만 삭제할 수 있습니다.")
    db.delete(comment); db.commit()
    return {"status": "Success"}

@router.put("/api/comments/{comment_id}")
def update_comment(comment_id: int, comment_data: schemas.CommentUpdate, db: Session = Depends(database.get_db)):
    comment = db.query(models.CommunityComment).filter(models.CommunityComment.comment_id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != comment_data.user_id:
        raise HTTPException(status_code=403, detail="본인이 작성한 댓글만 수정할 수 있습니다.")

    content = comment_data.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="댓글 내용을 입력해 주세요.")

    comment.content = content
    db.commit()
    return {"status": "Success"}

@router.get("/api/community/posts/count/{user_id}")
def get_community_posts_count(user_id: int, db: Session = Depends(database.get_db)):
    return {"status": "Success", "count": db.query(models.CommunityPost).filter(models.CommunityPost.user_id == user_id).count()}

@router.get("/api/community/comments/count/{user_id}")
def get_community_comments_count(user_id: int, db: Session = Depends(database.get_db)):
    return {"status": "Success", "count": db.query(models.CommunityComment).filter(models.CommunityComment.user_id == user_id).count()}

@router.get("/api/community/my-posts/{user_id}")
def get_my_posts(user_id: int, db: Session = Depends(database.get_db)):
    try:
        like_count_subquery = db.query(models.CommunityPostLike.post_id.label("post_id"), func.count(models.CommunityPostLike.like_id).label("like_count")).group_by(models.CommunityPostLike.post_id).subquery()
        results = db.query(models.CommunityPost, func.coalesce(models.User.nickname, models.User.name).label("author_name"), models.User.role.label("author_role"), func.count(models.CommunityComment.comment_id).label("comment_count"), func.coalesce(like_count_subquery.c.like_count, 0).label("like_count")).outerjoin(models.User, models.CommunityPost.user_id == models.User.id).outerjoin(models.CommunityComment, models.CommunityPost.post_id == models.CommunityComment.post_id).outerjoin(like_count_subquery, models.CommunityPost.post_id == like_count_subquery.c.post_id).filter(models.CommunityPost.user_id == user_id).group_by(models.CommunityPost.post_id, models.User.id, like_count_subquery.c.like_count).order_by(models.CommunityPost.created_at.desc()).all()
        return {"status": "Success", "posts": [{"post_id": p.post_id, "user_id": p.user_id, "pregnancy_period": p.pregnancy_period, "title": p.title, "content": p.content, "created_at": p.created_at, "author": aname or "익명", "role": arole, "comment_count": count, "like_count": int(like_count or 0)} for p, aname, arole, count, like_count in results]}
    except Exception as e: return {"status": "Error", "message": str(e)}

@router.get("/api/community/my-comments/{user_id}")
def get_my_commented_posts(user_id: int, db: Session = Depends(database.get_db)):
    try:
        subquery = db.query(models.CommunityComment.post_id).filter(models.CommunityComment.user_id == user_id).distinct().subquery()
        results = db.query(models.CommunityPost, func.coalesce(models.User.nickname, models.User.name).label("author_name"), models.User.role.label("author_role"), func.count(models.CommunityComment.comment_id).label("comment_count")).outerjoin(models.User, models.CommunityPost.user_id == models.User.id).outerjoin(models.CommunityComment, models.CommunityPost.post_id == models.CommunityComment.post_id).filter(models.CommunityPost.post_id.in_(subquery)).group_by(models.CommunityPost.post_id, models.User.id).order_by(models.CommunityPost.created_at.desc()).all()
        return {"status": "Success", "comments": [{"post_id": p.post_id, "user_id": p.user_id, "pregnancy_period": p.pregnancy_period, "title": p.title, "content": p.content, "created_at": p.created_at, "author": aname or "익명", "role": arole, "comment_count": count} for p, aname, arole, count in results]}
    except Exception as e: return {"status": "Error", "message": str(e)}
