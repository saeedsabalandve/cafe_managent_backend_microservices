# infrastructure/terraform/elasticache.tf
# #elasticache #redis #cache-cluster

# ============================================
# ElastiCache Subnet Group
# ============================================
resource "aws_elasticache_subnet_group" "main" {
  name       = "cafe-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

# ============================================
# ElastiCache Redis Cluster
# ============================================
resource "aws_elasticache_replication_group" "main" {
  replication_group_id          = "cafe-management-redis"
  replication_group_description = "Redis cluster for café management"
  
  engine         = "redis"
  engine_version = "6.x"
  node_type      = "cache.t3.micro"
  port           = 6379

  num_cache_clusters         = 2
  automatic_failover_enabled = true

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  parameter_group_name = "default.redis6.x"

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Environment = "production"
  }
}

# ============================================
# Redis Security Group
# ============================================
resource "aws_security_group" "redis" {
  name        = "redis-sg"
  description = "ElastiCache Redis security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.services.id]
    description     = "From ECS services"
  }

  tags = {
    Name = "redis-sg"
  }
}
