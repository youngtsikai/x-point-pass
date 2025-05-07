import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityFlagsComponent } from './security-flags.component';

describe('SecurityFlagsComponent', () => {
  let component: SecurityFlagsComponent;
  let fixture: ComponentFixture<SecurityFlagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityFlagsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityFlagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
