# infrastructure/terraform/rds.tf
# #rds-postgresql #multi-az #menu-inventory-databases

# ============================================
# RDS Subnet Group
# ============================================
resource "aws_db_subnet_group" "main" {
  name       = "cafe-db-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "cafe-db-subnet-group"
  }
}

# ============================================
# RDS PostgreSQL Instance
# ============================================
resource "aws_db_instance" "postgres" {
  identifier = "cafe-management-db"
  
  engine         = "postgres"
  engine_version = "12.4"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 200
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "cafe_management"
  username = var.db_username
  password = var.db_password

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true

  skip_final_snapshot = false
  final_snapshot_identifier = "cafe-management-db-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = {
    Environment = "production"
    Project     = "cafe-management"
  }
}

# ============================================
# RDS Security Group
# ============================================
resource "aws_security_group" "rds" {
  name        = "rds-postgres-sg"
  description = "RDS PostgreSQL security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.services.id]
    description     = "From ECS services"
  }

  tags = {
    Name = "rds-postgres-sg"
  }
}
