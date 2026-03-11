/**
 * Skill Configuration & Management System
 * Single source of truth: edit skills only in this file.
 * Changes automatically update the skill universe UI.
 */

// Editable Skills Configuration
const skillsConfig = [
  {
    name: "HTML5",
    category: "Web Development",
    icon: "🌐",
    color: "cyan"
  },
  {
    name: "CSS3",
    category: "Web Development",
    icon: "🎨",
    color: "blue"
  },
  {
    name: "JavaScript",
    category: "Programming Languages",
    icon: "⚙️",
    color: "purple"
  },
  {
    name: "TypeScript",
    category: "Programming Languages",
    icon: "📘",
    color: "cyan"
  },
  {
    name: "Python",
    category: "Programming Languages",
    icon: "🐍",
    color: "blue"
  },
  {
    name: "Machine Learning",
    category: "AI / Machine Learning",
    icon: "🧠",
    color: "purple"
  },
  {
    name: "Prompt Engineering",
    category: "AI / Machine Learning",
    icon: "✨",
    color: "cyan"
  },
  {
    name: "Git",
    category: "Tools & Technologies",
    icon: "🔧",
    color: "blue"
  },
  {
    name: "Figma",
    category: "Tools & Technologies",
    icon: "🧩",
    color: "cyan"
  },
  {
    name: "Node.js",
    category: "Tools & Technologies",
    icon: "🚀",
    color: "purple"
  }
];

// Skills array for backward compatibility
let skills = [...skillsConfig];

// Skill Management Functions
class SkillManager {
  constructor() {
    this.skills = [...skillsConfig];
    this.listeners = [];
  }

  /**
   * Add a new skill
   * @param {Object} skill - Skill object with name, category, icon, color
   */
  addSkill(skill) {
    if (!skill.name || !skill.category) {
      console.error("Skill must have name and category");
      return false;
    }

    const newSkill = {
      name: skill.name,
      category: skill.category,
      icon: skill.icon || "⭐",
      color: skill.color || "cyan"
    };

    this.skills.push(newSkill);
    skills = [...this.skills];
    this.notifyListeners();
    console.log(`✅ Skill added: ${newSkill.name}`);
    return true;
  }

  /**
   * Delete a skill by name
   * @param {string} skillName - Name of the skill to delete
   */
  deleteSkill(skillName) {
    const index = this.skills.findIndex(
      s => s.name.toLowerCase() === skillName.toLowerCase()
    );

    if (index === -1) {
      console.error(`Skill "${skillName}" not found`);
      return false;
    }

    const deleted = this.skills.splice(index, 1);
    skills = [...this.skills];
    this.notifyListeners();
    console.log(`✅ Skill deleted: ${deleted[0].name}`);
    return true;
  }

  /**
   * Update a skill
   * @param {string} skillName - Name of the skill to update
   * @param {Object} updates - Properties to update
   */
  updateSkill(skillName, updates) {
    const skill = this.skills.find(
      s => s.name.toLowerCase() === skillName.toLowerCase()
    );

    if (!skill) {
      console.error(`Skill "${skillName}" not found`);
      return false;
    }

    Object.assign(skill, updates);
    this.notifyListeners();
    console.log(`✅ Skill updated: ${skillName}`);
    return true;
  }

  /**
   * Get all skills
   */
  getSkills() {
    return [...this.skills];
  }

  /**
   * Get skills by category
   */
  getSkillsByCategory(category) {
    return this.skills.filter(s => s.category === category);
  }

  /**
   * Subscribe to skill changes
   */
  subscribe(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.skills);
      } catch (error) {
        console.error("Error in skill listener:", error);
      }
    });
  }

  /**
   * Export skills as JSON
   */
  exportSkills() {
    return JSON.stringify(this.skills, null, 2);
  }

  /**
   * Reset to default skills
   */
  resetToDefault() {
    this.skills = [...skillsConfig];
    skills = [...this.skills];
    this.notifyListeners();
    console.log("✅ Skills reset to default");
  }
}

// Initialize skill manager
const skillManager = new SkillManager();

// Example usage (uncomment to test):
// skillManager.addSkill({ name: "React", category: "Web Development", icon: "⚛️", color: "blue" });
// skillManager.updateSkill("React", { color: "cyan" });
// skillManager.deleteSkill("React");
// console.log(skillManager.getSkills());
