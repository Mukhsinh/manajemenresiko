// Enhanced Flowchart for Buku Pedoman - Comprehensive Business Process Flow
// This module provides a complete, professional flowchart visualization

const EnhancedFlowchartModule = (() => {
    // Comprehensive flowchart data based on ISO 31000:2018
    const flowchartData = {
        title: "Flowchart Proses Bisnis Sistem Manajemen Risiko",
        subtitle: "Berdasarkan ISO 31000:2018",
        description: "Diagram alur proses bisnis manajemen risiko terintegrasi dengan Balanced Scorecard",
        
        // Process nodes with proper positioning for comprehensive view
        processes: [
            // Row 1 - Start
            { id: "start", type: "terminal", label: "MULAI", x: 500, y: 40, color: "#27ae60" },
            
            // Row 2 - Strategic Planning Phase
            { id: "strategic_planning", type: "process", label: "Perencanaan Strategis", x: 500, y: 110, color: "#3498db", width: 180 },
            
            // Row 3 - Three parallel strategic components
            { id: "visi_misi", type: "process", label: "Penetapan\nVisi & Misi", x: 200, y: 190, color: "#9b59b6", width: 140 },
            { id: "swot_analysis", type: "process", label: "Analisis SWOT\n& Diagram Kartesius", x: 500, y: 190, color: "#9b59b6", width: 160 },
            { id: "strategic_map", type: "process", label: "Penyusunan\nStrategic Map", x: 800, y: 190, color: "#9b59b6", width: 140 },
            
            // Row 4 - TOWS Matrix
            { id: "tows_matrix", type: "process", label: "Matriks TOWS\n(Strategi SO, WO, ST, WT)", x: 500, y: 280, color: "#e67e22", width: 200 },
            
            // Row 5 - Sasaran Strategi
            { id: "sasaran_strategi", type: "process", label: "Penetapan\nSasaran Strategi", x: 500, y: 360, color: "#3498db", width: 160 },
            
            // Row 6 - IKU
            { id: "iku", type: "process", label: "Indikator Kinerja\nUtama (IKU)", x: 500, y: 440, color: "#3498db", width: 160 },
            
            // Row 7 - Risk Identification Phase
            { id: "risk_identification", type: "process", label: "Identifikasi Risiko\n(Risk Register)", x: 500, y: 530, color: "#e74c3c", width: 180 },
            
            // Row 8 - Risk Analysis
            { id: "risk_analysis", type: "process", label: "Analisis Risiko\n(Inherent Risk)", x: 500, y: 620, color: "#e74c3c", width: 180 },
            
            // Row 9 - Risk Evaluation Decision
            { id: "risk_evaluation", type: "decision", label: "Evaluasi\nRisiko?", x: 500, y: 710, color: "#f39c12" },
            
            // Row 10 - Risk Treatment (if needed)
            { id: "risk_treatment", type: "process", label: "Perlakuan Risiko\n(Mitigasi)", x: 750, y: 710, color: "#e74c3c", width: 160 },
            
            // Row 11 - Residual Risk
            { id: "residual_risk", type: "process", label: "Analisis\nResidual Risk", x: 750, y: 800, color: "#e74c3c", width: 160 },
            
            // Row 12 - KRI & Monitoring
            { id: "kri", type: "process", label: "Key Risk\nIndicator (KRI)", x: 500, y: 800, color: "#1abc9c", width: 160 },
            
            // Row 13 - Monitoring & Evaluation
            { id: "monitoring", type: "process", label: "Monitoring &\nEvaluasi Risiko", x: 500, y: 890, color: "#1abc9c", width: 180 },
            
            // Row 14 - Reporting
            { id: "reporting", type: "process", label: "Pelaporan\nManajemen Risiko", x: 500, y: 970, color: "#34495e", width: 180 },
            
            // Row 15 - End
            { id: "end", type: "terminal", label: "SELESAI", x: 500, y: 1050, color: "#c0392b" },
            
            // Side processes - Communication & Consultation (continuous)
            { id: "communication", type: "process", label: "Komunikasi &\nKonsultasi", x: 100, y: 550, color: "#16a085", width: 140, isVertical: true },
            
            // Side processes - Recording & Reporting (continuous)
            { id: "recording", type: "process", label: "Pencatatan &\nPelaporan", x: 900, y: 550, color: "#16a085", width: 140, isVertical: true }
        ],
        
        // Connections between processes
        connections: [
            // Main flow
            { from: "start", to: "strategic_planning", type: "arrow" },
            { from: "strategic_planning", to: "visi_misi", type: "arrow" },
            { from: "strategic_planning", to: "swot_analysis", type: "arrow" },
            { from: "strategic_planning", to: "strategic_map", type: "arrow" },
            { from: "visi_misi", to: "tows_matrix", type: "arrow" },
            { from: "swot_analysis", to: "tows_matrix", type: "arrow" },
            { from: "strategic_map", to: "tows_matrix", type: "arrow" },
            { from: "tows_matrix", to: "sasaran_strategi", type: "arrow" },
            { from: "sasaran_strategi", to: "iku", type: "arrow" },
            { from: "iku", to: "risk_identification", type: "arrow" },
            { from: "risk_identification", to: "risk_analysis", type: "arrow" },
            { from: "risk_analysis", to: "risk_evaluation", type: "arrow" },
            { from: "risk_evaluation", to: "risk_treatment", type: "arrow", label: "Tidak\nAcceptable" },
            { from: "risk_evaluation", to: "kri", type: "arrow", label: "Acceptable" },
            { from: "risk_treatment", to: "residual_risk", type: "arrow" },
            { from: "residual_risk", to: "kri", type: "arrow" },
            { from: "kri", to: "monitoring", type: "arrow" },
            { from: "monitoring", to: "reporting", type: "arrow" },
            { from: "reporting", to: "end", type: "arrow" },
            
            // Feedback loop
            { from: "monitoring", to: "risk_identification", type: "feedback", label: "Feedback Loop" }
        ]
    };

    // Render the complete flowchart
    function renderFlowchart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Flowchart container not found:', containerId);
            return;
        }

        const svgWidth = 1000;
        const svgHeight = 1150;

        container.innerHTML = `
            <div class="flowchart-wrapper" style="width: 100%; overflow-x: auto; background: #f8f9fa; border-radius: 12px; padding: 20px;">
                <svg id="flowchart-svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" 
                     style="display: block; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    
                    <!-- Definitions -->
                    <defs>
                        <!-- Grid pattern -->
                        <pattern id="flowchart-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" stroke-width="0.5"/>
                        </pattern>
                        
                        <!-- Arrow marker -->
                        <marker id="flowchart-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#555"/>
                        </marker>
                        
                        <!-- Feedback arrow marker -->
                        <marker id="flowchart-feedback-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#e74c3c"/>
                        </marker>
                        
                        <!-- Drop shadow filter -->
                        <filter id="flowchart-shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.2"/>
                        </filter>
                    </defs>
                    
                    <!-- Background -->
                    <rect width="100%" height="100%" fill="url(#flowchart-grid)"/>
                    
                    <!-- Title -->
                    <text x="${svgWidth/2}" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#2c3e50">
                        ${flowchartData.title}
                    </text>
                    
                    <!-- Connections (rendered first, behind nodes) -->
                    ${renderConnections()}
                    
                    <!-- Process Nodes -->
                    ${renderNodes()}
                    
                    <!-- Side labels for continuous processes -->
                    ${renderSideLabels()}
                </svg>
                
                <!-- Legend -->
                ${renderLegend()}
            </div>
        `;
    }

    function renderNodes() {
        return flowchartData.processes.map(process => {
            const width = process.width || 140;
            const height = process.isVertical ? 300 : 50;
            
            switch (process.type) {
                case 'terminal':
                    return renderTerminal(process);
                case 'decision':
                    return renderDecision(process);
                case 'process':
                default:
                    return renderProcess(process, width, height);
            }
        }).join('');
    }

    function renderTerminal(process) {
        const width = 100;
        const height = 40;
        return `
            <g class="flowchart-node" data-id="${process.id}" style="cursor: pointer;">
                <ellipse cx="${process.x}" cy="${process.y}" rx="${width/2}" ry="${height/2}" 
                         fill="${process.color}" stroke="${darkenColor(process.color)}" stroke-width="2" filter="url(#flowchart-shadow)"/>
                <text x="${process.x}" y="${process.y + 5}" text-anchor="middle" font-family="Arial, sans-serif" 
                      font-size="12" font-weight="bold" fill="white">${process.label}</text>
            </g>
        `;
    }

    function renderDecision(process) {
        const size = 50;
        const points = `${process.x},${process.y - size} ${process.x + size},${process.y} ${process.x},${process.y + size} ${process.x - size},${process.y}`;
        const lines = process.label.split('\n');
        
        return `
            <g class="flowchart-node" data-id="${process.id}" style="cursor: pointer;">
                <polygon points="${points}" fill="${process.color}" stroke="${darkenColor(process.color)}" stroke-width="2" filter="url(#flowchart-shadow)"/>
                ${lines.map((line, i) => `
                    <text x="${process.x}" y="${process.y + (i - (lines.length-1)/2) * 12 + 4}" text-anchor="middle" 
                          font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="white">${line}</text>
                `).join('')}
            </g>
        `;
    }

    function renderProcess(process, width, height) {
        const x = process.x - width / 2;
        const y = process.y - height / 2;
        const lines = process.label.split('\n');
        const lineHeight = 14;
        const startY = process.y - ((lines.length - 1) * lineHeight) / 2 + 4;
        
        if (process.isVertical) {
            // Vertical process box for side elements
            return `
                <g class="flowchart-node" data-id="${process.id}" style="cursor: pointer;">
                    <rect x="${x}" y="${process.y - 150}" width="${width}" height="300" rx="8" ry="8" 
                          fill="${process.color}" stroke="${darkenColor(process.color)}" stroke-width="2" filter="url(#flowchart-shadow)"/>
                    ${lines.map((line, i) => `
                        <text x="${process.x}" y="${process.y + (i - (lines.length-1)/2) * lineHeight}" text-anchor="middle" 
                              font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white">${line}</text>
                    `).join('')}
                    <text x="${process.x}" y="${process.y + 30}" text-anchor="middle" font-family="Arial, sans-serif" 
                          font-size="9" fill="rgba(255,255,255,0.8)">(Berkelanjutan)</text>
                </g>
            `;
        }
        
        return `
            <g class="flowchart-node" data-id="${process.id}" style="cursor: pointer;">
                <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" ry="6" 
                      fill="${process.color}" stroke="${darkenColor(process.color)}" stroke-width="2" filter="url(#flowchart-shadow)"/>
                ${lines.map((line, i) => `
                    <text x="${process.x}" y="${startY + i * lineHeight}" text-anchor="middle" 
                          font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white">${line}</text>
                `).join('')}
            </g>
        `;
    }

    function renderConnections() {
        return flowchartData.connections.map(conn => {
            const fromNode = flowchartData.processes.find(p => p.id === conn.from);
            const toNode = flowchartData.processes.find(p => p.id === conn.to);
            
            if (!fromNode || !toNode) return '';
            
            return renderConnection(fromNode, toNode, conn);
        }).join('');
    }

    function renderConnection(from, to, conn) {
        const fromWidth = from.width || 140;
        const toWidth = to.width || 140;
        const fromHeight = from.type === 'terminal' ? 40 : (from.type === 'decision' ? 100 : 50);
        const toHeight = to.type === 'terminal' ? 40 : (to.type === 'decision' ? 100 : 50);
        
        let x1 = from.x;
        let y1 = from.y;
        let x2 = to.x;
        let y2 = to.y;
        
        // Calculate connection points based on relative positions
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        // Adjust start point
        if (Math.abs(dy) > Math.abs(dx)) {
            // Vertical connection
            y1 += dy > 0 ? fromHeight / 2 : -fromHeight / 2;
            y2 += dy > 0 ? -toHeight / 2 : toHeight / 2;
        } else {
            // Horizontal connection
            x1 += dx > 0 ? fromWidth / 2 : -fromWidth / 2;
            x2 += dx > 0 ? -toWidth / 2 : toWidth / 2;
        }
        
        // Special handling for decision node outputs
        if (from.type === 'decision') {
            if (dx > 50) {
                // Right output (No)
                x1 = from.x + 50;
                y1 = from.y;
            } else if (dy > 50) {
                // Bottom output (Yes)
                x1 = from.x;
                y1 = from.y + 50;
            }
        }
        
        // Generate path
        let path;
        const isFeedback = conn.type === 'feedback';
        
        if (isFeedback) {
            // Feedback loop - curved path going left
            const midX = Math.min(x1, x2) - 80;
            path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
        } else if (Math.abs(dx) < 20) {
            // Straight vertical line
            path = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else if (Math.abs(dy) < 20) {
            // Straight horizontal line
            path = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else {
            // L-shaped or curved connection
            const midY = (y1 + y2) / 2;
            path = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
        }
        
        const strokeColor = isFeedback ? '#e74c3c' : '#555';
        const strokeDash = isFeedback ? '5,5' : 'none';
        const markerEnd = isFeedback ? 'url(#flowchart-feedback-arrow)' : 'url(#flowchart-arrow)';
        
        // Label position
        const labelX = (x1 + x2) / 2;
        const labelY = (y1 + y2) / 2 - 8;
        
        return `
            <g class="flowchart-connection">
                <path d="${path}" stroke="${strokeColor}" stroke-width="2" fill="none" 
                      stroke-dasharray="${strokeDash}" marker-end="${markerEnd}"/>
                ${conn.label ? `
                    <rect x="${labelX - 35}" y="${labelY - 12}" width="70" height="24" fill="white" rx="4"/>
                    <text x="${labelX}" y="${labelY + 4}" text-anchor="middle" font-family="Arial, sans-serif" 
                          font-size="9" fill="#333" font-weight="bold">${conn.label.replace('\n', ' ')}</text>
                ` : ''}
            </g>
        `;
    }

    function renderSideLabels() {
        return `
            <!-- Left side bracket -->
            <path d="M 170 400 L 150 400 L 150 700 L 170 700" stroke="#16a085" stroke-width="2" fill="none"/>
            
            <!-- Right side bracket -->
            <path d="M 830 400 L 850 400 L 850 700 L 830 700" stroke="#16a085" stroke-width="2" fill="none"/>
        `;
    }

    function renderLegend() {
        return `
            <div class="flowchart-legend" style="margin-top: 20px; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e0e0e0;">
                <h4 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-info-circle"></i> Keterangan Simbol
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 50px; height: 25px; background: #27ae60; border-radius: 12px;"></div>
                        <span style="font-size: 12px; color: #555;">Terminal (Mulai/Selesai)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 50px; height: 25px; background: #3498db; border-radius: 4px;"></div>
                        <span style="font-size: 12px; color: #555;">Proses</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 25px; height: 25px; background: #f39c12; transform: rotate(45deg);"></div>
                        <span style="font-size: 12px; color: #555; margin-left: 5px;">Keputusan</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 40px; height: 2px; background: #555; position: relative;">
                            <div style="position: absolute; right: -2px; top: -4px; width: 0; height: 0; border-left: 8px solid #555; border-top: 5px solid transparent; border-bottom: 5px solid transparent;"></div>
                        </div>
                        <span style="font-size: 12px; color: #555;">Alur Proses</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 40px; height: 2px; background: #e74c3c; border-style: dashed; position: relative;">
                            <div style="position: absolute; right: -2px; top: -4px; width: 0; height: 0; border-left: 8px solid #e74c3c; border-top: 5px solid transparent; border-bottom: 5px solid transparent;"></div>
                        </div>
                        <span style="font-size: 12px; color: #555;">Feedback Loop</span>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                    <h5 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 13px;">Fase Proses:</h5>
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
                        <span style="padding: 5px 12px; background: #9b59b6; color: white; border-radius: 15px; font-size: 11px;">Perencanaan Strategis</span>
                        <span style="padding: 5px 12px; background: #3498db; color: white; border-radius: 15px; font-size: 11px;">BSC & IKU</span>
                        <span style="padding: 5px 12px; background: #e74c3c; color: white; border-radius: 15px; font-size: 11px;">Manajemen Risiko</span>
                        <span style="padding: 5px 12px; background: #1abc9c; color: white; border-radius: 15px; font-size: 11px;">Monitoring & Evaluasi</span>
                        <span style="padding: 5px 12px; background: #16a085; color: white; border-radius: 15px; font-size: 11px;">Proses Berkelanjutan</span>
                    </div>
                </div>
            </div>
        `;
    }

    function darkenColor(color) {
        // Simple color darkening
        const colors = {
            '#27ae60': '#1e8449',
            '#3498db': '#2980b9',
            '#9b59b6': '#8e44ad',
            '#e67e22': '#d35400',
            '#e74c3c': '#c0392b',
            '#f39c12': '#d68910',
            '#1abc9c': '#16a085',
            '#34495e': '#2c3e50',
            '#16a085': '#138d75',
            '#c0392b': '#a93226'
        };
        return colors[color] || color;
    }

    // Public API
    return {
        render: renderFlowchart,
        getData: () => flowchartData
    };
})();

// Export for global access
window.EnhancedFlowchartModule = EnhancedFlowchartModule;
console.log('✅ EnhancedFlowchartModule loaded');
