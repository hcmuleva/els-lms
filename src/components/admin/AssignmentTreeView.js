import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './AssignmentTreeView.css';

const AssignmentTreeView = ({ enrolments }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!enrolments || enrolments.length === 0) return;

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 80, right: 20, bottom: 50, left: 20 };
    const nodeWidth = 180;
    const nodeHeight = 80;
    const levelHeight = 150;
    const nodeSpacing = 40;

    // Calculate dimensions based on content
    const maxWidth = Math.max(
      1200,
      enrolments.reduce((max, enrolment) => {
        const teacherCount = enrolment.teachers?.length || 0;
        const studentCount = enrolment.students?.length || 0;
        const maxUsers = Math.max(teacherCount, studentCount);
        return Math.max(max, (maxUsers * (nodeWidth + nodeSpacing)) + 200);
      }, 1200)
    );

    const height = 700;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", maxWidth)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const width = maxWidth - margin.left - margin.right;

    // Process each enrolment
    enrolments.forEach((enrolment, eIndex) => {
      const startY = eIndex * (height / enrolments.length);
      const teachers = enrolment.teachers || [];
      const students = enrolment.students || [];
      const totalUsers = Math.max(teachers.length, students.length);
      
      // Calculate positions
      const courseX = width / 2;
      const courseY = startY + 50;

      // Calculate width for user nodes
      const usersWidth = totalUsers * (nodeWidth + nodeSpacing);
      const startX = (width - usersWidth) / 2;

      // Draw course node (root)
      const courseGroup = svg.append('g')
        .attr('class', 'node course-node')
        .attr('transform', `translate(${courseX},${courseY})`);

      courseGroup.append('rect')
        .attr('x', -nodeWidth / 2)
        .attr('y', -nodeHeight / 2)
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('rx', 8)
        .style('fill', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
        .style('stroke', '#667eea')
        .style('stroke-width', 3);

      courseGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', -10)
        .style('fill', 'white')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(enrolment.course?.name || 'Course');

      courseGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 10)
        .style('fill', 'white')
        .style('font-size', '11px')
        .text(`${teachers.length} Teachers | ${students.length} Students`);

      // Teacher group label
      const teacherLabelY = courseY + levelHeight;
      const teacherLabelX = width / 4;

      svg.append('rect')
        .attr('x', teacherLabelX - 80)
        .attr('y', teacherLabelY - 25)
        .attr('width', 160)
        .attr('height', 50)
        .attr('rx', 8)
        .style('fill', '#9b59b6')
        .style('stroke', '#8e44ad')
        .style('stroke-width', 2);

      svg.append('text')
        .attr('x', teacherLabelX)
        .attr('y', teacherLabelY)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('👨‍🏫 Teachers');

      // Student group label
      const studentLabelY = courseY + levelHeight;
      const studentLabelX = (3 * width) / 4;

      svg.append('rect')
        .attr('x', studentLabelX - 80)
        .attr('y', studentLabelY - 25)
        .attr('width', 160)
        .attr('height', 50)
        .attr('rx', 8)
        .style('fill', '#2ecc71')
        .style('stroke', '#27ae60')
        .style('stroke-width', 2);

      svg.append('text')
        .attr('x', studentLabelX)
        .attr('y', studentLabelY)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('👨‍🎓 Students');

      // Draw connecting lines from course to groups
      // Line to Teachers group
      svg.append('line')
        .attr('x1', courseX)
        .attr('y1', courseY + nodeHeight / 2)
        .attr('x2', courseX)
        .attr('y2', teacherLabelY - 50)
        .style('stroke', '#667eea')
        .style('stroke-width', 3);

      svg.append('line')
        .attr('x1', courseX)
        .attr('y1', teacherLabelY - 50)
        .attr('x2', teacherLabelX)
        .attr('y2', teacherLabelY - 50)
        .style('stroke', '#9b59b6')
        .style('stroke-width', 3);

      svg.append('line')
        .attr('x1', teacherLabelX)
        .attr('y1', teacherLabelY - 50)
        .attr('x2', teacherLabelX)
        .attr('y2', teacherLabelY - 25)
        .style('stroke', '#9b59b6')
        .style('stroke-width', 3);

      // Line to Students group
      svg.append('line')
        .attr('x1', courseX)
        .attr('y1', teacherLabelY - 50)
        .attr('x2', studentLabelX)
        .attr('y2', teacherLabelY - 50)
        .style('stroke', '#2ecc71')
        .style('stroke-width', 3);

      svg.append('line')
        .attr('x1', studentLabelX)
        .attr('y1', teacherLabelY - 50)
        .attr('x2', studentLabelX)
        .attr('y2', studentLabelY - 25)
        .style('stroke', '#2ecc71')
        .style('stroke-width', 3);

      // Draw teacher nodes
      const teacherY = teacherLabelY + levelHeight;
      teachers.forEach((teacher, tIndex) => {
        const teacherX = teacherLabelX - ((teachers.length - 1) * (nodeWidth + nodeSpacing) / 2) + (tIndex * (nodeWidth + nodeSpacing));

        // Line from group to teacher
        svg.append('line')
          .attr('x1', teacherLabelX)
          .attr('y1', teacherLabelY + 25)
          .attr('x2', teacherLabelX)
          .attr('y2', teacherY - 60)
          .style('stroke', '#9b59b6')
          .style('stroke-width', 2);

        if (teachers.length > 1) {
          svg.append('line')
            .attr('x1', teacherLabelX - ((teachers.length - 1) * (nodeWidth + nodeSpacing) / 2))
            .attr('y1', teacherY - 60)
            .attr('x2', teacherLabelX + ((teachers.length - 1) * (nodeWidth + nodeSpacing) / 2))
            .attr('y2', teacherY - 60)
            .style('stroke', '#9b59b6')
            .style('stroke-width', 2);
        }

        svg.append('line')
          .attr('x1', teacherX)
          .attr('y1', teacherY - 60)
          .attr('x2', teacherX)
          .attr('y2', teacherY - nodeHeight / 2)
          .style('stroke', '#9b59b6')
          .style('stroke-width', 2);

        const teacherGroup = svg.append('g')
          .attr('class', 'node teacher-node')
          .attr('transform', `translate(${teacherX},${teacherY})`);

        // Add pattern for avatar
        const defs = svg.append('defs');
        defs.append('pattern')
          .attr('id', `teacher-avatar-${eIndex}-${tIndex}`)
          .attr('width', 1)
          .attr('height', 1)
          .append('image')
          .attr('xlink:href', `https://ui-avatars.com/api/?name=${teacher.firstName}+${teacher.lastName || teacher.username}&background=9b59b6&color=fff&size=128`)
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 60)
          .attr('height', 60);

        teacherGroup.append('rect')
          .attr('x', -nodeWidth / 2)
          .attr('y', -nodeHeight / 2)
          .attr('width', nodeWidth)
          .attr('height', nodeHeight)
          .attr('rx', 8)
          .style('fill', 'white')
          .style('stroke', '#9b59b6')
          .style('stroke-width', 3);

        teacherGroup.append('circle')
          .attr('cx', 0)
          .attr('cy', -15)
          .attr('r', 25)
          .style('fill', `url(#teacher-avatar-${eIndex}-${tIndex})`)
          .style('stroke', '#9b59b6')
          .style('stroke-width', 2);

        teacherGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', 25)
          .style('fill', '#2c3e50')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(`${teacher.firstName} ${teacher.lastName || ''}`);
      });

      // Draw student nodes
      const studentY = studentLabelY + levelHeight;
      students.forEach((student, sIndex) => {
        const studentX = studentLabelX - ((students.length - 1) * (nodeWidth + nodeSpacing) / 2) + (sIndex * (nodeWidth + nodeSpacing));

        // Line from group to student
        svg.append('line')
          .attr('x1', studentLabelX)
          .attr('y1', studentLabelY + 25)
          .attr('x2', studentLabelX)
          .attr('y2', studentY - 60)
          .style('stroke', '#2ecc71')
          .style('stroke-width', 2);

        if (students.length > 1) {
          svg.append('line')
            .attr('x1', studentLabelX - ((students.length - 1) * (nodeWidth + nodeSpacing) / 2))
            .attr('y1', studentY - 60)
            .attr('x2', studentLabelX + ((students.length - 1) * (nodeWidth + nodeSpacing) / 2))
            .attr('y2', studentY - 60)
            .style('stroke', '#2ecc71')
            .style('stroke-width', 2);
        }

        svg.append('line')
          .attr('x1', studentX)
          .attr('y1', studentY - 60)
          .attr('x2', studentX)
          .attr('y2', studentY - nodeHeight / 2)
          .style('stroke', '#2ecc71')
          .style('stroke-width', 2);

        const studentGroup = svg.append('g')
          .attr('class', 'node student-node')
          .attr('transform', `translate(${studentX},${studentY})`);

        // Add pattern for avatar
        const defs = svg.append('defs');
        defs.append('pattern')
          .attr('id', `student-avatar-${eIndex}-${sIndex}`)
          .attr('width', 1)
          .attr('height', 1)
          .append('image')
          .attr('xlink:href', `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName || student.username}&background=2ecc71&color=fff&size=128`)
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 60)
          .attr('height', 60);

        studentGroup.append('rect')
          .attr('x', -nodeWidth / 2)
          .attr('y', -nodeHeight / 2)
          .attr('width', nodeWidth)
          .attr('height', nodeHeight)
          .attr('rx', 8)
          .style('fill', 'white')
          .style('stroke', '#2ecc71')
          .style('stroke-width', 3);

        studentGroup.append('circle')
          .attr('cx', 0)
          .attr('cy', -15)
          .attr('r', 25)
          .style('fill', `url(#student-avatar-${eIndex}-${sIndex})`)
          .style('stroke', '#2ecc71')
          .style('stroke-width', 2);

        studentGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', 25)
          .style('fill', '#2c3e50')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(`${student.firstName} ${student.lastName || ''}`);
      });
    });

  }, [enrolments]);

  return (
    <div className="assignment-tree-container">
      <div className="tree-header">
        <h3>🏢 Organization Chart View</h3>
        <div className="tree-legend">
          <span className="legend-item teacher">
            <span className="legend-dot"></span> Teachers
          </span>
          <span className="legend-item student">
            <span className="legend-dot"></span> Students
          </span>
        </div>
      </div>
      <div className="tree-canvas">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default AssignmentTreeView;
