"""moderated gaming news links

Revision ID: 2ed284cd9280
Revises: 9eb308213ae8
"""
import sqlalchemy as sa
from alembic import op

revision = "2ed284cd9280"
down_revision = "9eb308213ae8"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "news_articles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("url", sa.String(length=1000), nullable=False),
        sa.Column("source", sa.String(length=120), nullable=False),
        sa.Column("published_at", sa.String(length=45), nullable=False),
        sa.Column("imported_at", sa.String(length=45), nullable=False),
        sa.Column("approved", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url"),
    )


def downgrade():
    op.drop_table("news_articles")
