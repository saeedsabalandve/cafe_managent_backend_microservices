# infrastructure/terraform/ecs.tf
# #ecs-fargate #task-definitions #services

# ============================================
# Task Execution Role
# ============================================
resource "aws_iam_role" "ecs_execution" {
  name = "ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ============================================
# API Gateway Service
# ============================================
resource "aws_ecs_task_definition" "api_gateway" {
  family                   = "api-gateway"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name  = "api-gateway"
    image = "${var.ecr_registry}/cafe-api-gateway:${var.image_tag}"
    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "AUTH_SERVICE_URL", value = "http://auth-service.${var.service_discovery_namespace}:3001" },
      { name = "MENU_SERVICE_URL", value = "http://menu-service.${var.service_discovery_namespace}:3002" },
      { name = "ORDER_SERVICE_URL", value = "http://order-service.${var.service_discovery_namespace}:3003" },
      { name = "INVENTORY_SERVICE_URL", value = "http://inventory-service.${var.service_discovery_namespace}:3004" },
    ]
    secrets = [
      { name = "JWT_PUBLIC_KEY", valueFrom = var.jwt_public_key_arn },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/api-gateway"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "api_gateway" {
  name            = "api-gateway"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_gateway.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.api_gateway.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_gateway.arn
    container_name   = "api-gateway"
    container_port   = 3000
  }

  service_registries {
    registry_arn = aws_service_discovery_service.api_gateway.arn
  }

  depends_on = [aws_lb_listener.api_gateway]
}

# ============================================
# Auth Service
# ============================================
resource "aws_ecs_task_definition" "auth_service" {
  family                   = "auth-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name  = "auth-service"
    image = "${var.ecr_registry}/cafe-auth-service:${var.image_tag}"
    portMappings = [{
      containerPort = 3001
      protocol      = "tcp"
    }]
    environment = [
      { name = "AUTH_MONGODB_URI", value = "mongodb://${aws_docdb_cluster.main.endpoint}:27017/auth_db" },
    ]
    secrets = [
      { name = "AUTH_JWT_PRIVATE_KEY", valueFrom = var.jwt_private_key_arn },
      { name = "AUTH_JWT_PUBLIC_KEY", valueFrom = var.jwt_public_key_arn },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/auth-service"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "auth_service" {
  name            = "auth-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.auth_service.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.services.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.auth_service.arn
  }
}
