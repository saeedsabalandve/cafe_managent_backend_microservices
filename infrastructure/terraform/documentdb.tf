# infrastructure/terraform/documentdb.tf
# #documentdb #mongodb-compatible #auth-orders

# ============================================
# DocumentDB Subnet Group
# ============================================
resource "aws_docdb_subnet_group" "main" {
  name       = "cafe-docdb-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

# ============================================
# DocumentDB Cluster
# ============================================
resource "aws_docdb_cluster" "main" {
  cluster_identifier      = "cafe-management-docdb"
  engine                  = "docdb"
  engine_version          = "4.0.0"
  master_username         = var.docdb_username
  master_password         = var.docdb_password
  db_subnet_group_name    = aws_docdb_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.docdb.id]

  backup_retention_period = 30
  preferred_backup_window = "04:00-05:00"
  
  skip_final_snapshot     = false
  final_snapshot_identifier = "cafe-management-docdb-final"

  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  tags = {
    Environment = "production"
  }
}

resource "aws_docdb_cluster_instance" "main" {
  count              = 2
  identifier         = "cafe-docdb-${count.index}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = "db.r5.large"
}

# ============================================
# DocumentDB Security Group
# ============================================
resource "aws_security_group" "docdb" {
  name        = "docdb-sg"
  description = "DocumentDB security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.services.id]
    description     = "From ECS services"
  }

  tags = {
    Name = "docdb-sg"
  }
}
