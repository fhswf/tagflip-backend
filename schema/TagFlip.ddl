-- MySQL Script generated by MySQL Workbench
-- Sat Sep 26 21:41:22 2020
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema tagflip
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `tagflip` ;

-- -----------------------------------------------------
-- Schema tagflip
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `tagflip` DEFAULT CHARACTER SET utf8 ;
SHOW WARNINGS;
USE `tagflip` ;

-- -----------------------------------------------------
-- Table `tagflip`.`Annotation`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tagflip`.`Annotation` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `tagflip`.`Annotation` (
  `annotationId` INT(11) NOT NULL AUTO_INCREMENT,
  `annotationSetId` INT(11) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `color` CHAR(7) NOT NULL DEFAULT '#bbbbbb',
  `createdAt` DATETIME NULL DEFAULT NULL,
  `updatedAt` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`annotationId`),
  CONSTRAINT `FKannotation324602`
    FOREIGN KEY (`annotationSetId`)
    REFERENCES `tagflip`.`AnnotationSet` (`annotationSetId`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

SHOW WARNINGS;
CREATE UNIQUE INDEX `UK_AnnotationSet_AnnotationName` ON `tagflip`.`Annotation` (`annotationSetId` ASC, `name` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `FKannotation324602` ON `tagflip`.`Annotation` (`annotationSetId` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `tagflip`.`AnnotationSet`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tagflip`.`AnnotationSet` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `tagflip`.`AnnotationSet` (
  `annotationSetId` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `createdAt` DATETIME NULL DEFAULT NULL,
  `updatedAt` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`annotationSetId`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

SHOW WARNINGS;
CREATE UNIQUE INDEX `name` ON `tagflip`.`AnnotationSet` (`name` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `tagflip`.`AnnotationTask`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tagflip`.`AnnotationTask` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `tagflip`.`AnnotationTask` (
  `annotationTaskId` INT(11) NOT NULL AUTO_INCREMENT,
  `corpusId` INT(11) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `description` TEXT NULL,
  `annotationTaskStateId` INT NOT NULL DEFAULT 1,
  `priority` INT NOT NULL,
  `createdAt` DATETIME NULL DEFAULT NULL,
  `updatedAt` DATETIME NULL,
  PRIMARY KEY (`annotationTaskId`),
  CONSTRAINT `fk_AnnotationTask_Corpus1`
    FOREIGN KEY (`corpusId`)
    REFERENCES `tagflip`.`Corpus` (`corpusId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_AnnotationTask_AnnotationTaskState1`
    FOREIGN KEY (`annotationTaskStateId`)
    REFERENCES `tagflip`.`AnnotationTaskState` (`annotationTaskStateId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

SHOW WARNINGS;
CREATE INDEX `fk_AnnotationTask_Corpus1_idx` ON `tagflip`.`AnnotationTask` (`corpusId` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `fk_AnnotationTask_AnnotationTaskState1_idx` ON `tagflip`.`AnnotationTask` (`annotationTaskStateId` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `tagflip`.`AnnotationTaskDocument`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tagflip`.`AnnotationTaskDocument` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `tagflip`.`AnnotationTaskDocument` (
  `annotationTaskDocumentId` INT(11) NOT NULL AUTO_INCREMENT,
  `annotationTaskId` INT(11) NOT NULL,
  `documentId` INT(11) NOT NULL,
  `state` ENUM('open', 'inprogress', 'done') NOT NULL DEFAULT 'open',
  `createdAt` DATETIME NULL DEFAULT NULL,
  `updatedAt` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`annotationTaskDocumentId`, `annotationTaskId`),
  CONSTRAINT `fk_AnnotationTask_has_Document_Document1`
    FOREIGN KEY (`documentId`)
    REFERENCES `tagflip`.`Document` (`documentId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_AnnotationTaskDocument_AnnotationTask1`
    FOREIGN KEY (`annotationTaskId`)
    REFERENCES `tagflip`.`AnnotationTask` (`annotationTaskId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

SHOW WARNINGS;
CREATE INDEX `fk_AnnotationTask_has_Document_Document1_idx` ON `tagflip`.`AnnotationTaskDocument` (`documentId` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `fk_AnnotationTaskDocument_AnnotationTask1_idx` ON `tagflip`.`AnnotationTaskDocument` (`annotationTaskId` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `fk_state` ON `tagflip`.`AnnotationTaskDocument` (`state` ASC) VISIBLE;

SHOW WARNINGS;
CREATE UNIQUE INDEX `UQ_annotationTaskId_documentId` ON `tagflip`.`AnnotationTaskDocument` (`annotationTaskId` ASC, `documentId` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `tagflip`.`AnnotationTaskState`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tagflip`.`AnnotationTaskState` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `tagflip`.`AnnotationTaskState` (
  `annotationTaskStateId` INT NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  `color` VARCHAR(7) NULL,
  `visible` TINYINT(1) NOT NULL,
  `createdAt` DATETIME NULL,
  `updatedAt` DATETIME NULL,
  PRIMARY KEY (`annotationTaskStateId`))
ENGINE = InnoDB;

SHOW WARNINGS;
CREATE UNIQUE INDEX `name_UNIQUE` ON `tagflip`.`AnnotationTaskState` (`name` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `tagflip`.`Corpus`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tagflip`.`Corpus` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `tagflip`.`Corpus` (
  `corpusId` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `createdAt` DATETIME NULL DEFAULT NULL,
  `updatedAt` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`corpusId`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

SHOW WARNINGS;
CREATE UNIQUE INDEX `name_UNIQUE` ON `tagflip`.`Corpus` (`name` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `tagflip`.`CorpusAnnotationSets`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tagflip`.`CorpusAnnotationSets` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `tagflip`.`CorpusAnnotationSets` (
  `corpusId` INT(11) NOT NULL,
  `annotationSetId` INT(11) NOT NULL,
  `createdAt` DATETIME NULL DEFAULT NULL,
  `updatedAt` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`corpusId`, `annotationSetId`),
  CONSTRAINT `fk_CorpusAnnotationSets_Corpus1`
    FOREIGN KEY (`corpusId`)
    REFERENCES `tagflip`.`Corpus` (`corpusId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_CorpusAnnotationSets_AnnotationSet1`
    FOREIGN KEY (`annotationSetId`)
    REFERENCES `tagflip`.`AnnotationSet` (`annotationSetId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

SHOW WARNINGS;
CREATE INDEX `fk_CorpusAnnotationSets_Corpus1_idx` ON `tagflip`.`CorpusAnnotationSets` (`corpusId` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `fk_CorpusAnnotationSets_AnnotationSet1_idx` ON `tagflip`.`CorpusAnnotationSets` (`annotationSetId` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `tagflip`.`Document`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tagflip`.`Document` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `tagflip`.`Document` (
  `documentId` INT(11) NOT NULL AUTO_INCREMENT,
  `corpusId` INT(11) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `documentHash` CHAR(64) NOT NULL COMMENT 'SHA-256',
  `content` LONGTEXT NULL DEFAULT NULL,
  `createdAt` DATETIME NULL DEFAULT NULL,
  `updatedAt` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`documentId`),
  CONSTRAINT `fk_Document_Corpus1`
    FOREIGN KEY (`corpusId`)
    REFERENCES `tagflip`.`Corpus` (`corpusId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

SHOW WARNINGS;
CREATE INDEX `fk_Document_Corpus1_idx` ON `tagflip`.`Document` (`corpusId` ASC) VISIBLE;

SHOW WARNINGS;

-- -----------------------------------------------------
-- Table `tagflip`.`Tag`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tagflip`.`Tag` ;

SHOW WARNINGS;
CREATE TABLE IF NOT EXISTS `tagflip`.`Tag` (
  `tagId` INT(11) NOT NULL AUTO_INCREMENT,
  `annotationId` INT(11) NOT NULL,
  `documentId` INT(11) NOT NULL,
  `annotationTaskId` INT(11) NULL,
  `startIndex` INT(11) NOT NULL,
  `endIndex` INT(11) NOT NULL,
  `createdAt` DATETIME NULL DEFAULT NULL,
  `updatedAt` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`tagId`),
  CONSTRAINT `fk_Tag_Annotation1`
    FOREIGN KEY (`annotationId`)
    REFERENCES `tagflip`.`Annotation` (`annotationId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Tag_Document1`
    FOREIGN KEY (`documentId`)
    REFERENCES `tagflip`.`Document` (`documentId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Tag_AnnotationTask1`
    FOREIGN KEY (`annotationTaskId`)
    REFERENCES `tagflip`.`AnnotationTask` (`annotationTaskId`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

SHOW WARNINGS;
CREATE INDEX `fk_Tag_Annotation1` ON `tagflip`.`Tag` (`annotationId` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `fk_Tag_Document1_idx` ON `tagflip`.`Tag` (`documentId` ASC) VISIBLE;

SHOW WARNINGS;
CREATE INDEX `fk_Tag_AnnotationTask1_idx` ON `tagflip`.`Tag` (`annotationTaskId` ASC) VISIBLE;

SHOW WARNINGS;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
